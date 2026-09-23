# zmdld11 の博客

个人博客，基于 **Astro 5** 从零自建，部署在 GitHub Pages：<https://zmdld11.github.io>

> 重建计划、架构设计与进度看板见仓库根目录 [《博客重建方案.md》](./博客重建方案.md)，
> 任务拆解见 GitHub Issues（标签：博客重构）。

## 常用命令

```bash
npm install      # 安装依赖
npm run dev      # 本地开发（http://localhost:4321）
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

## 目录速览

```
src/config/site.ts        # 少动层：站点信息/布局/组件开关
src/content/              # 常动层：文章 + settings JSON（后台可改）
src/pages/preview/        # 首页设计稿 v1-v4（选型用，选完移除）
src/styles/global.css     # 设计令牌（全站视觉唯一来源）
cloudflare-worker/        # OAuth 网关（重构 6/8 时落地）
```

## 设计稿选型（当前阶段）

`npm run dev` 后访问 <http://localhost:4321>，可在四版主页设计稿间切换：
V1 玻璃 Bento / V2 杂志编辑部 / V3 奶油软糖 / V4 终端极客。
