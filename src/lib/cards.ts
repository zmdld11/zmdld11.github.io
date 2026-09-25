// 卡片商店注册表：首页每张 Bento 卡片的元数据（商店弹窗展示 + 客户端启停）
// defaultOn 是出厂默认；用户在商店里的选择存 localStorage bento-cards-v1，优先级更高。
// 注意：这里只管"客户端显隐"，site.ts widgets.* 仍是最总开关（false 时 SSR 不渲染该卡）。
export interface CardMeta {
  id: string;
  name: string;
  desc: string;
  icon: string;
  defaultOn: boolean;
}

export const CARDS: CardMeta[] = [
  { id: "identity", name: "身份卡", desc: "头像、签名与外链入口，右上角当月贡献格", icon: "🪪", defaultOn: true },
  { id: "clock", name: "时钟", desc: "当前时间与完整日期", icon: "⏰", defaultOn: true },
  { id: "calendar", name: "日历", desc: "当月月历，含农历、节日与节气", icon: "🗓️", defaultOn: true },
  { id: "github", name: "GitHub 动态", desc: "公开事件流，构建期预取 + 客户端静默刷新", icon: "🐙", defaultOn: true },
  { id: "posts", name: "最新文章", desc: "最近发布的两篇文章", icon: "✍️", defaultOn: true },
  { id: "music", name: "音乐播放器", desc: "网易云歌单 / 本地歌单，与右下角迷你条联动", icon: "🎵", defaultOn: true },
  { id: "hitokoto", name: "一言", desc: "hitokoto 随机句子", icon: "💬", defaultOn: true },
  { id: "weather", name: "天气", desc: "Open-Meteo 实时天气，免 key 浏览器直连", icon: "⛅", defaultOn: true },
  { id: "poem", name: "每日诗词", desc: "今日诗词，每次刷新随机一首", icon: "📜", defaultOn: true },
  { id: "fortune", name: "命理小馆", desc: "独立站入口：星盘 · 八字 · 紫微 · 六爻 · 塔罗", icon: "🔮", defaultOn: true },
  { id: "bangumi", name: "追番 · 在看", desc: "Bangumi 在看收藏封面条，构建期同步", icon: "📺", defaultOn: true },
  { id: "stats", name: "小站统计", desc: "文章数、访客数与运行天数", icon: "📈", defaultOn: true },
];

export const CARD_STORE_KEY = "bento-cards-v1";

/** 合并出厂默认与用户选择的完整启停表 */
export function cardPrefs(): Record<string, boolean> {
  let saved: Record<string, boolean> = {};
  try {
    saved = JSON.parse(localStorage.getItem(CARD_STORE_KEY) ?? "{}");
  } catch {}
  const out: Record<string, boolean> = {};
  for (const c of CARDS) out[c.id] = saved[c.id] ?? c.defaultOn;
  return out;
}

/** 单卡是否启用（脚本发起网络请求前用） */
export function cardOn(id: string): boolean {
  return cardPrefs()[id] ?? true;
}

/** 把启停表应用到 DOM（商店开关与首屏加载共用） */
export function applyCards() {
  const prefs = cardPrefs();
  for (const c of CARDS) {
    const el = document.querySelector(`[data-card-id="${c.id}"]`);
    if (el) el.toggleAttribute("hidden", !prefs[c.id]);
  }
  window.dispatchEvent(new CustomEvent("bentocards", { detail: prefs }));
}
