# cloudflare-worker — 算命组件解读接口

`POST /api/fortune`:校验入参 → 每 IP 限流(10 分钟 5 次) → 复用 `src/scripts/fortune/prompts.ts` 组装 prompt → 转发 DeepSeek 流式回复。

**排盘 100% 在用户浏览器本地完成**,Worker 不做任何命理计算,只持有 key 和转发文本。

## 首次部署(约 5 分钟)

```bash
cd cloudflare-worker
npx wrangler login          # 浏览器登录你的 Cloudflare 账号(免费套餐即可)
npx wrangler secret put DEEPSEEK_KEY
#   按提示粘贴 DeepSeek 平台 https://platform.deepseek.com 生成的 API key
#   key 只存 Cloudflare secret,不进 Git 仓库、不进前端
npx wrangler deploy
```

部署成功会输出 `https://zmdld11-fortune.<你的子域>.workers.dev`。

## 接入博客

把完整接口地址填进 `src/content/settings/fortune.json`:

```json
{ "api": "https://zmdld11-fortune.<你的子域>.workers.dev/api/fortune" }
```

重新构建博客(push 自动构建)后,`/fortune` 页的「✨ 排盘 + AI 解读」按钮自动点亮。
`api` 留空时页面只提供本地排盘,不发任何请求。

## CORS / 安全

- 允许来源白名单:`https://zmdld11.github.io` 与本地 dev(`localhost:4321`),在 `src/index.ts` 的 `ALLOWED_ORIGINS` 调整。
- 限流是**单 isolate 内存级**(每个边缘节点独立计数),够个人博客流量用;若被恶意刷量,再加 Cloudflare Turnstile 或 KV 计数。
- 入参有结构与体量校验(sections 条数/单节大小),防超大 payload 烧 token。

## 本地调试

```bash
cd cloudflare-worker
npx wrangler dev            # 默认 :8787
# 另开一个终端,给前端指过去(临时改 fortune.json 的 api 为 http://127.0.0.1:8787/api/fortune)
# 注意:ALLOWED_ORIGINS 已含 http://127.0.0.1:4321
```
