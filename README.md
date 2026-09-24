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
src/content/posts/        # 文章：<slug>/index.md + 图片同目录随迁
src/content.config.ts     # collections 定义
src/layouts/SiteLayout.astro  # 站点骨架：页头/页脚/主题切换/极光背景
src/pages/preview/        # 首页选型设计稿存档（v1-v5，正式站基于 V5）
src/styles/global.css     # 设计令牌（全站视觉唯一来源）
src/scripts/fortune/      # 命理小馆排盘库（纯前端；AI 转发服务已拆到 My-Fortune 仓库）
scripts/                  # 一次性迁移与图片优化脚本
```

## 当前状态

- ✅ 已上线：首页（V5 玻璃 Bento，浅色默认 + 明暗切换）、文章页、归档、标签、关于
- 🚧 进行中：小组件接入真实数据（GitHub 动态/播放器/一言/统计）、自研发帖后台
