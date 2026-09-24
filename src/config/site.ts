// 站点「少动层」配置：改这里即可调整全站基础信息与布局（提交后自动构建生效）
// 「常动层」（背景/头图/节日版面/公告/歌单）在 src/content/settings/*.json，未来由 /admin/settings 后台修改

export const site = {
  /** 站点名（浏览器标题后缀、页头） */
  title: "zmdld11の窝",
  /** 站点副标题/签名 */
  subtitle: "写字、造轮子、记录生活",
  /** 作者 */
  author: "zmdld11",
  /** 部署地址（与 astro.config.mjs 的 site 保持一致） */
  url: "https://zmdld11.github.io",
  /** 页脚起始年份 */
  since: 2026,
  /** 建站日期（统计"运行天数"用） */
  sinceDate: "2026-02-21",
} as const;

/** 外链入口（量化看板等） */
export const socials = [
  { label: "GitHub", url: "https://github.com/zmdld11" },
  { label: "📊 量化看板", url: "http://101.133.134.164:8000" },
] as const;

/** 小组件注册表：一行开关，关闭后不渲染、不发请求 */
export const widgets = {
  clock: true,
  calendar: true,
  musicPlayer: true,
  githubActivity: true,
  contributions: true,
  hitokoto: true,
  fortune: true,
  visitorCounter: true,
} as const;

export type WidgetKey = keyof typeof widgets;
