// 一次性迁移脚本：content/（Quartz/Hexo 遗留）→ src/content/posts/<slug>/
// 用法：node scripts/migrate-quartz.mjs   （跑完打印 redirects 映射，供 astro.config.mjs 使用）
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { pinyin } from "pinyin-pro";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "content");
const DEST = path.join(ROOT, "src", "content", "posts");

/** 文件名 → slug：中文转拼音（按音节加连字符），拉丁/数字段保留 */
function toSlug(name) {
  if (!/[^\x00-\x7F]/.test(name)) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  const segs = pinyin(name, { toneType: "none", type: "array", nonZh: "consecutive" });
  return segs
    .map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ""))
    .filter(Boolean)
    .join("-");
}

/** tags/categories 归一化为数组 */
function toList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  return String(v)
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---- 第一遍：收集全部文件与新旧路径映射 ----
const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".md")) files.push(p);
  }
})(SRC);

const entries = []; // { file, relNoExt, fm, body, slug, skip }
const slugSet = new Set();
const oldToSlug = new Map(); // 旧相对路径（无扩展名，Quartz URL 形态）→ slug

for (const file of files) {
  const relNoExt = path.relative(SRC, file).replace(/\.md$/, "").replaceAll("\\", "/");
  const raw = fs.readFileSync(file, "utf8");
  const { data: fm, content: body } = matter(raw);

  if (relNoExt === "index") {
    entries.push({ file, relNoExt, fm, body, skip: "旧首页，不迁移" });
    continue;
  }

  const stem = path.basename(relNoExt);
  let slug = toSlug(stem);
  while (slugSet.has(slug)) slug += "-2";
  slugSet.add(slug);
  oldToSlug.set(relNoExt, slug);
  entries.push({ file, relNoExt, fm, body, slug });
}

// ---- 第二遍：转换并写出 ----
const redirects = {};
for (const e of entries) {
  if (e.skip) {
    console.log(`跳过 ${e.relNoExt}（${e.skip}）`);
    continue;
  }
  const stem = path.basename(e.relNoExt);
  let body = e.body;

  // 图片引用：](原文件夹名/xxx) → ](/xxx)（资产随迁到同目录）
  body = body.replaceAll(`](${stem}/`, "](./");

  // Hexo post_link：{% post_link 路径 '标题' %} → [标题](/posts/slug/)
  body = body.replace(
    /\{%\s*post_link\s+([^\s}]+)(?:\s+'([^']*)')?\s*%\}/g,
    (_, target, label) => {
      const slug = oldToSlug.get(target.replace(/^\/+|\/+$/g, ""));
      if (!slug) {
        console.warn(`  ⚠️ post_link 目标未找到: ${target}`);
        return _;
      }
      return `[${label ?? slug}](/posts/${slug}/)`;
    },
  );

  const fm = {
    title: String(e.fm.title ?? stem),
    pubDate: new Date(e.fm.date ?? Date.now()).toISOString(),
    ...(e.fm.description ? { description: String(e.fm.description) } : {}),
    tags: toList(e.fm.tags),
    ...(toList(e.fm.categories).length ? { category: toList(e.fm.categories)[0] } : {}),
    draft: false,
  };
  const out = matter.stringify(body, fm);

  const dir = path.join(DEST, e.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.md"), out, "utf8");

  // 资产文件夹随迁（只复制非 md 文件——目录页文件夹里的 md 是子文章，已单独迁移）
  const assetDir = path.join(path.dirname(e.file), stem);
  if (fs.existsSync(assetDir) && fs.statSync(assetDir).isDirectory()) {
    for (const name of fs.readdirSync(assetDir)) {
      if (name.endsWith(".md")) continue;
      const from = path.join(assetDir, name);
      if (!fs.statSync(from).isFile()) continue;
      fs.copyFileSync(from, path.join(dir, name));
    }
  }

  redirects[`/${e.relNoExt}`] = `/posts/${e.slug}/`;
  console.log(`✓ ${e.relNoExt} → ${e.slug}（tags: ${fm.tags.join(", ") || "-"}）`);
}

// 旧目录页本身也指向对应文章
console.log("\n// astro.config.mjs redirects（粘贴用）");
console.log("redirects: " + JSON.stringify(redirects, null, 2).replaceAll('"(', '"('));
fs.writeFileSync(path.join(ROOT, "scripts", "redirects.generated.json"), JSON.stringify(redirects, null, 2));
console.log("\n映射已写入 scripts/redirects.generated.json");
