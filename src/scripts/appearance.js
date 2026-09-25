// 美化面板：壁纸 / 鼠标指针 / 指针拖尾 / 点击特效 / 头像，全站生效
// 配置存 localStorage appearance-v1；本地上传的图片存 IndexedDB（壁纸可能几 MB，localStorage 放不下）。
// 卡片布局编辑在首页脚本里实现，这里只派发 open-card-editor 事件。
const STORE_KEY = "appearance-v1";
const DB_NAME = "blog-appearance";
const DB_STORE = "kv";

const DEFAULTS = {
  wallpaper: null, // 预设 key 或 "custom"
  dim: 0.35, // 壁纸暗度蒙版 0~0.7
  cursor: null, // 预设 key 或 "custom"
  trail: false,
  clickFx: "none", // none | burst | emoji | ripple
};

let settings = { ...DEFAULTS };
try {
  settings = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}") };
} catch {}

function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify(settings));
}

/* ---- IndexedDB 极简 kv ---- */
function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_STORE).objectStore(DB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(key, value) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
async function idbDel(key) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_STORE, "readwrite").objectStore(DB_STORE).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* ---- 内置预设 ---- */
// SVG 光标（data uri，热点在笔尖）；「默认」即还原系统指针
const CURSORS = {
  violet: { name: "紫罗兰", css: `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M3 2l16 9-7 1.6L15.5 21 12 22l-3.4-8.4L3 17z" fill="#6c5ce7" stroke="#fff" stroke-width="1.4"/></svg>`,
  )}") 3 2, auto` },
  star: { name: "星星", css: `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><path d="M13 2l2.7 7.2L23 12l-7.3 2.8L13 22l-2.7-7.2L3 12l7.3-2.8z" fill="#38bdf8" stroke="#fff" stroke-width="1.2"/></svg>`,
  )}") 4 4, auto` },
  heart: { name: "爱心", css: `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M12 21C7 16.5 3 13.3 3 9.3 3 6.4 5.2 4 8 4c1.6 0 3.1.8 4 2.1C12.9 4.8 14.4 4 16 4c2.8 0 5 2.4 5 5.3 0 4-4 7.2-9 11.7z" fill="#fb7185" stroke="#fff" stroke-width="1.2"/></svg>`,
  )}") 4 4, auto` },
};

let wallpaperPresets = {};
try {
  wallpaperPresets = import.meta.glob("../assets/wallpapers/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
  });
} catch {}

const WALLPAPER_NAMES = {
  "aurora-purple": "极光紫",
  sunset: "暖阳橘",
  mint: "薄荷绿",
};

const EMOJIS = ["✨", "💜", "🌟", "🫧", "🍀", "⭐️", "💫", "🌸"];
let objectUrl = null;

/* ---- 应用函数 ---- */
async function applyWallpaper() {
  const layer = document.getElementById("wallpaper-layer");
  if (!layer) return;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
  let url = null;
  if (settings.wallpaper === "custom") {
    const blob = await idbGet("wallpaper").catch(() => null);
    if (blob) {
      objectUrl = URL.createObjectURL(blob);
      url = objectUrl;
    }
  } else if (settings.wallpaper && wallpaperPresets[`../assets/wallpapers/${settings.wallpaper}.svg`]) {
    url = wallpaperPresets[`../assets/wallpapers/${settings.wallpaper}.svg`];
  }
  const site = document.querySelector(".site");
  if (url) {
    layer.style.backgroundImage = `url("${url}")`;
    layer.hidden = false;
    site?.classList.add("has-wallpaper");
  } else {
    layer.hidden = true;
    site?.classList.remove("has-wallpaper");
  }
  layer.style.setProperty("--wp-dim", String(settings.dim ?? DEFAULTS.dim));
}

function applyCursor() {
  const root = document.documentElement;
  if (settings.cursor === "custom") {
    idbGet("cursor")
      .then((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          root.style.setProperty("--cursor-set", `url("${url}") 4 4, auto`);
          root.classList.add("custom-cursor");
        } else root.classList.remove("custom-cursor");
      })
      .catch(() => root.classList.remove("custom-cursor"));
  } else if (settings.cursor && CURSORS[settings.cursor]) {
    root.style.setProperty("--cursor-set", CURSORS[settings.cursor].css);
    root.classList.add("custom-cursor");
  } else {
    root.style.removeProperty("--cursor-set");
    root.classList.remove("custom-cursor");
  }
}

async function applyAvatar() {
  const avatar = document.querySelector(".identity .avatar");
  if (!avatar) return;
  if (settings.avatar) {
    const blob = await idbGet("avatar").catch(() => null);
    if (blob) {
      const url = URL.createObjectURL(blob);
      avatar.style.backgroundImage = `url("${url}")`;
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
      avatar.dataset.origText ??= avatar.textContent;
      avatar.textContent = "";
      return;
    }
  }
  avatar.style.backgroundImage = "";
  if (avatar.dataset.origText) avatar.textContent = avatar.dataset.origText;
}

/* ---- 指针拖尾与点击特效（DOM 粒子，数量小、动画完即移除） ---- */
let lastTrail = 0;
function bindEffects() {
  document.addEventListener(
    "pointermove",
    (e) => {
      if (!settings.trail) return;
      const now = performance.now();
      if (now - lastTrail < 28) return; // 节流 ~35fps
      lastTrail = now;
      const d = document.createElement("i");
      d.className = "fx-dot";
      const size = 4 + Math.random() * 6;
      d.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;width:${size}px;height:${size}px;background:${
        Math.random() > 0.5 ? "var(--accent)" : "var(--accent-2)"
      }`;
      document.body.append(d);
      setTimeout(() => d.remove(), 650);
    },
    { passive: true },
  );

  document.addEventListener("click", (e) => {
    const fx = settings.clickFx;
    if (fx === "none") return;
    if (fx === "ripple") {
      const r = document.createElement("i");
      r.className = "fx-ripple";
      r.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
      document.body.append(r);
      setTimeout(() => r.remove(), 700);
      return;
    }
    if (fx === "burst") {
      for (let i = 0; i < 10; i++) {
        const p = document.createElement("i");
        p.className = "fx-burst";
        const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
        const dist = 26 + Math.random() * 26;
        p.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--dx:${Math.cos(angle) * dist}px;--dy:${
          Math.sin(angle) * dist
        }px;background:${Math.random() > 0.5 ? "var(--accent)" : "var(--accent-2)"}`;
        document.body.append(p);
        setTimeout(() => p.remove(), 650);
      }
      return;
    }
    if (fx === "emoji") {
      for (let i = 0; i < 3; i++) {
        const s = document.createElement("span");
        s.className = "fx-emoji";
        s.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        s.style.cssText = `left:${e.clientX + (Math.random() * 40 - 20)}px;top:${e.clientY}px;--dy:-${
          60 + Math.random() * 60
        }px`;
        document.body.append(s);
        setTimeout(() => s.remove(), 950);
      }
    }
  });
}

/* ---- 面板 UI ---- */
function buildDrawer() {
  const fab = document.getElementById("appearance-fab");
  const drawer = document.getElementById("appearance-drawer");
  if (!fab || !drawer) return;

  // 预设壁纸缩略图
  const grid = drawer.querySelector("#wp-grid");
  if (grid) {
    grid.innerHTML = "";
    for (const [path, url] of Object.entries(wallpaperPresets)) {
      const key = path.split("/").pop().replace(".svg", "");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "wp-thumb";
      b.title = WALLPAPER_NAMES[key] ?? key;
      b.dataset.wp = key;
      b.style.backgroundImage = `url("${url}")`;
      b.addEventListener("click", () => {
        settings.wallpaper = key;
        save();
        applyWallpaper();
        sync();
      });
      grid.append(b);
    }
  }

  const sync = () => {
    for (const b of drawer.querySelectorAll("[data-wp]"))
      b.classList.toggle("on", settings.wallpaper === b.dataset.wp);
    for (const b of drawer.querySelectorAll("[data-cursor]"))
      b.classList.toggle("on", settings.cursor === b.dataset.cursor);
    const dim = drawer.querySelector("#wp-dim");
    if (dim) dim.value = settings.dim;
    const trail = drawer.querySelector("#trail-toggle");
    if (trail) trail.checked = settings.trail;
    for (const r of drawer.querySelectorAll('input[name="clickfx"]'))
      r.checked = r.value === settings.clickFx;
    const uploadWp = drawer.querySelector("#wp-upload-label");
    if (uploadWp) uploadWp.classList.toggle("on", settings.wallpaper === "custom");
    const layoutBtn = drawer.querySelector("#layout-edit");
    if (layoutBtn) layoutBtn.hidden = !document.querySelector(".bento");
  };

  fab.addEventListener("click", () => {
    sync();
    drawer.hidden = !drawer.hidden;
    if (!drawer.hidden) drawer.scrollTop = 0; // 每次打开都从标题开始
  });
  drawer.querySelector("#appearance-close")?.addEventListener("click", () => {
    drawer.hidden = true;
  });
  drawer.addEventListener("click", (e) => {
    const act = (sel) => drawer.querySelector(sel);
    const curBtn = e.target.closest("[data-cursor]");
    if (curBtn) {
      settings.cursor = curBtn.dataset.cursor;
      save();
      applyCursor();
      sync();
      return;
    }
    if (e.target.closest("#wp-none")) {
      settings.wallpaper = null;
      save();
      applyWallpaper();
      sync();
    } else if (e.target.closest("#wp-upload")) {
      act("#wp-upload").click();
    } else if (e.target.closest("#cursor-default")) {
      settings.cursor = null;
      save();
      applyCursor();
      sync();
    } else if (e.target.closest("#cursor-upload-label")) {
      act("#cursor-upload").click();
    } else if (e.target.closest("#avatar-upload-label")) {
      act("#avatar-upload").click();
    } else if (e.target.closest("#avatar-clear")) {
      settings.avatar = false;
      save();
      applyAvatar();
    } else if (e.target.closest("#layout-edit")) {
      drawer.hidden = true;
      window.dispatchEvent(new CustomEvent("open-card-editor"));
    } else if (e.target.closest("#appearance-reset")) {
      settings = { ...DEFAULTS };
      save();
      idbDel("wallpaper").catch(() => {});
      idbDel("cursor").catch(() => {});
      idbDel("avatar").catch(() => {});
      applyWallpaper();
      applyCursor();
      applyAvatar();
      sync();
    }
  });
  drawer.addEventListener("input", (e) => {
    if (e.target.id === "wp-dim") {
      settings.dim = Number(e.target.value);
      save();
      applyWallpaper();
    } else if (e.target.id === "trail-toggle") {
      settings.trail = e.target.checked;
      save();
    } else if (e.target.name === "clickfx") {
      settings.clickFx = e.target.value;
      save();
    }
  });
  drawer.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target.id === "wp-upload") {
      await idbPut("wallpaper", file);
      settings.wallpaper = "custom";
      save();
      applyWallpaper();
    } else if (e.target.id === "cursor-upload") {
      await idbPut("cursor", file);
      settings.cursor = "custom";
      save();
      applyCursor();
    } else if (e.target.id === "avatar-upload") {
      await idbPut("avatar", file);
      settings.avatar = true;
      save();
      applyAvatar();
    }
    sync();
  });
}

export function initAppearance() {
  const layer = document.getElementById("wallpaper-layer");
  if (!layer) return; // 布局未挂载
  bindEffects();
  buildDrawer();
  applyWallpaper();
  applyCursor();
  applyAvatar();
}
