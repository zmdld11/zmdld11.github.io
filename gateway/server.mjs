// GitHub OAuth 回调网关：只做一件事——用 code + client_secret 换 token，再 302 回博客 /admin。
// token 不落盘、不打日志；除此之外无任何端点。部署见 gateway/README.md。
import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 8788);
const CLIENT_ID = process.env.OAUTH_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET ?? "";
const REDIRECT_URI =
  process.env.OAUTH_REDIRECT_URI ?? `http://101.133.134.164:${PORT}/oauth/callback`;
const BLOG_URL = (process.env.BLOG_URL ?? "https://zmdld11.github.io").replace(/\/$/, "");

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/healthz") {
    res.writeHead(200).end("ok");
    return;
  }
  if (url.pathname === "/oauth/callback") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state") ?? "";
    if (!code) return redirect(res, `${BLOG_URL}/admin#error=${encodeURIComponent("missing_code")}`);
    try {
      const resp = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });
      const data = await resp.json();
      if (data.access_token) {
        // state 原样带回，由 /admin 页与 localStorage 中的值比对（CSRF 校验在前端完成）
        return redirect(
          res,
          `${BLOG_URL}/admin#access_token=${encodeURIComponent(data.access_token)}&state=${encodeURIComponent(state)}`,
        );
      }
      return redirect(
        res,
        `${BLOG_URL}/admin#error=${encodeURIComponent(data.error_description ?? data.error ?? "token_exchange_failed")}`,
      );
    } catch (e) {
      return redirect(res, `${BLOG_URL}/admin#error=${encodeURIComponent(String(e?.message ?? e))}`);
    }
  }
  res.writeHead(404).end("not found");
});

server.listen(PORT, () => console.log(`blog gateway listening on :${PORT}`));
process.on("SIGTERM", () => server.close(() => process.exit(0)));

function redirect(res, location) {
  res.writeHead(302, { Location: location }).end();
}
