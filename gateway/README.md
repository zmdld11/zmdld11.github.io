# blog-gateway：GitHub OAuth 回调网关（issue #8）

单文件 node:http 服务（零依赖），职责：`/oauth/callback` 用授权码换 token 后 302 回博客 `/admin`。
token 不落盘不记日志；`client_secret` 只存在服务器的 `.env`。配合 `/admin` 网页投稿（issue #9）使用。

## 为什么是 HTTP 也能用

OAuth 全程是**整页导航重定向**（博客页 → github.com → 网关 → 回博客页），不涉及 HTTPS 页面内
fetch HTTP 接口，因此不触发混合内容拦截；token 只出现在回博客页的 URL fragment（#），不会发给服务器。
后续若上域名/HTTPS，改 `BLOG_URL` 与 OAuth App 回调即可。

## 部署（阿里云，实际采用 Docker 方式）

服务器无裸 node 且惯例用 docker（fortune/qqbot 均容器化），故实际部署为 node:20-alpine 容器：

```bash
# 本机：上传网关文件
scp -r gateway/ root@101.133.134.164:/home/admin/blog-gateway

# 服务器：写 .env（不要提交到任何仓库；root 属主 600）
cd /home/admin/blog-gateway
printf 'OAUTH_CLIENT_ID=你的_client_id\nOAUTH_CLIENT_SECRET=你的_client_secret\n' > .env && chmod 600 .env

# 启动容器（host 网络 + restart always，重启自愈）
docker run -d --name blog-gateway --restart always --network host \
  --env-file /home/admin/blog-gateway/.env \
  -v /home/admin/blog-gateway:/app -w /app node:20-alpine node server.mjs

curl http://127.0.0.1:8788/healthz   # 期望 ok
```

`gateway.service`（systemd 裸 node 方案）保留作备选，需 `apt install nodejs`（≥18，server.mjs 用了全局 fetch）。

**出境不稳的兜底**：阿里云到 github.com 部分线路不通（实测约 1/3 成功、成功时 <1s），
`exchangeToken` 内置 5 次尝试 × 8s 超时 + 递增退避，实测整链 0.8s 完成。

然后：
1. 阿里云安全组放行 TCP 8788；
2. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App：
   - Homepage URL：`https://zmdld11.github.io`
   - Redirect URI：`http://101.133.134.164:8788/oauth/callback`（必须一字不差；**不要勾** Expire user access tokens）
   - 把 client_id 填到博客仓库 `src/config/admin.ts` 的 `oauthClientId`；
3. 博客访问 `/admin` → 使用 GitHub 登录。

## 排障

- `journalctl -u gateway -f` 看日志（无 token 输出）；
- 登录报 `redirect_uri mismatch`：OAuth App 回调与实际地址不一致；
- 回博客后 `state 校验失败`：换浏览器/清 localStorage 后重新登录即可。
