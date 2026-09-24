// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// 站点唯一事实配置：域名、构建、旧路径跳转
export default defineConfig({
  site: "https://zmdld11.github.io",
  vite: {
    plugins: [tailwindcss()],
  },
  // 旧 Quartz 中文路径 → 新 /posts/<slug>/（迁移脚本生成，见 scripts/redirects.generated.json）
  redirects: {
    "/4ATS开发日志1": "/posts/4ats-kai-fa-ri-zhi-1/",
    "/ROG枪神8清灰换相变片——预习篇": "/posts/rog-qiang-shen-8-qing-hui-huan-xiang-bian-pian-yu-xi-pian/",
    "/创博客文": "/posts/chuang-bo-ke-wen/",
    "/扫街1": "/posts/sao-jie-1/",
    "/软件推荐目录/bandizip-7zip": "/posts/bandizip-7zip/",
    "/软件推荐目录/crack-collection": "/posts/crack-collection/",
    "/软件推荐目录/everything": "/posts/everything/",
    "/软件推荐目录/idm": "/posts/idm/",
    "/软件推荐目录/iobit-uninstaller": "/posts/iobit-uninstaller/",
    "/软件推荐目录/obs": "/posts/obs/",
    "/软件推荐目录/potplayer": "/posts/potplayer/",
    "/软件推荐目录/qbittorrent": "/posts/qbittorrent/",
    "/软件推荐目录/spacesniffer": "/posts/spacesniffer/",
    "/软件推荐目录/tubatoolbox": "/posts/tubatoolbox/",
    "/软件推荐目录/vscode": "/posts/vscode/",
    "/软件推荐目录/xiaowan-toolbox": "/posts/xiaowan-toolbox/",
    "/软件推荐目录": "/posts/ruan-jian-tui-jian-mu-lu/",
    "/配置shokax中遇到的问题": "/posts/pei-zhi-shokax-zhong-yu-dao-de-wen-ti/",
    "/音频分离模型训练中的NaN问题": "/posts/yin-pin-fen-li-mo-xing-xun-lian-zhong-de-nan-wen-ti/",
  },
});
