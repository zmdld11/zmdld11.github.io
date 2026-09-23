// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// 站点唯一事实配置：域名、构建、旧路径跳转
export default defineConfig({
  site: "https://zmdld11.github.io",
  vite: {
    plugins: [tailwindcss()],
  },
  // redirects: 旧中文路径映射将在内容迁移（博客重构 2/8, issue #4）时加入
});
