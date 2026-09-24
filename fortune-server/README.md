# fortune-server — 算命 AI 转发服务（自托管版）

`cloudflare-worker` 的 Node 镜像：行为完全一致（同一份校验/限流/CORS/prompt 代码），解决 **workers.dev 在大陆被 DNS 污染、境内访客不可达** 的问题。排盘仍 100% 在浏览器前端，本服务只做「校验 → 限流 → 拼 prompt → 流式转发 DeepSeek」，不存储任何数据。

- 产物是**单文件** `dist/server.mjs`（约 27KB），服务器只需要 **Node ≥ 18**，无需 npm install
- 上游 `api.deepseek.com` 在国内直连，速度快
- `GET /healthz` 探活用（不限流）

## 构建

```bash
npm run build:server        # esbuild 打包 → fortune-server/dist/server.mjs
npm run test:server         # 本地全路径回归（自动起 mock 上游，14 项断言）
```

## 部署（通用部分）

```bash
# 1. 上传
scp fortune-server/dist/server.mjs user@服务器:/opt/fortune-server/server.mjs

# 2. key 环境变量（绝不入库、绝不进前端）
ssh user@服务器
cat > /opt/fortune-server/fortune.env <<'EOF'
DEEPSEEK_KEY=sk-你的key
PORT=8787
EOF
chmod 600 /opt/fortune-server/fortune.env

# 3. systemd 常驻
cat > /etc/systemd/system/fortune-server.service <<'EOF'
[Unit]
Description=fortune AI proxy (MyBlog)
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/fortune-server/server.mjs
EnvironmentFile=/opt/fortune-server/fortune.env
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload && systemctl enable --now fortune-server

# 4. 探活
curl -s http://127.0.0.1:8787/healthz   # {"ok":true}
```

### nginx 反代（SSE 两个关键点）

```nginx
location /api/fortune {
    proxy_pass http://127.0.0.1:8787;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # 限流按真实 IP
    proxy_buffering off;        # ① 必须：不关缓冲前端就不是逐字流式
    proxy_read_timeout 300s;    # ② DeepSeek 长解读可达数分钟
}
```

## HTTPS 三种情形（按你的服务器对号入座）

博客页面是 HTTPS，浏览器禁止 HTTPS 页面调 HTTP 接口（mixed content），所以**必须 HTTPS**。三选一：

### A. 大陆机 + 已备案域名（最顺）
域名加一条 A 记录指到服务器，nginx 443 复用现有证书，把上面的 location 挂进去即可。前端 api 填 `https://你的域名/api/fortune`。

### B. 大陆机 + 域名未备案
阿里云会拦截未备案域名的 80/443。绕法：**非标端口 + DNS-01 证书**（不碰 80 端口）：

```bash
# acme.sh DNS 验证签证书（阿里云 DNS：先在控制台建 AccessKey）
acme.sh --issue --dns dns_ali -d fortune.你的域名.com
acme.sh --install-cert -d fortune.你的域名.com \
  --key-file /etc/nginx/certs/fortune.key --fullchain-file /etc/nginx/certs/fortune.pem
```

nginx 监听 `8443 ssl`（安全组放行 8443），前端 api 填 `https://fortune.你的域名.com:8443/api/fortune`。

### C. 香港/海外机
无备案问题，`certbot --nginx` 或 Caddy 自动签 443 即可。

## 收尾

1. `src/content/settings/fortune.json` 的 `"api"` 换成上面的新地址（**必须含 `/api/fortune` 路径**）
2. 浏览器实测：勾模块 → 排盘 → AI 解读逐字流式
3. Cloudflare Worker 保留作备份：要切回去只需把 api 字段换回 workers.dev 地址

## 与 Cloudflare Worker 的差异备忘

| | Cloudflare Worker | fortune-server |
|---|---|---|
| 大陆可达性 | ✗（workers.dev 被 DNS 污染） | ✓ |
| key 存放 | wrangler secret | 服务器环境变量（chmod 600） |
| 限流 | 单 isolate 内存 | 单进程内存（同口径：10 分钟 5 次/IP） |
| HTTPS | 自动 | 自理（上面三情形） |
| 源码 | `cloudflare-worker/src/index.ts` | `fortune-server/index.ts`（复用前者导出的 helpers） |

两边共用 `src/scripts/fortune/prompts.ts`（系统规则/锚点/输出模板），改解读风格只需改这一处、两边重新构建。
