// /admin 网页投稿配置。oauthClientId 在注册 GitHub OAuth App 后填写（公开值，可入库）；
// client_secret 只存服务器 gateway/.env，绝不进仓库、绝不进前端。
export const admin = {
  owner: "zmdld11",
  repo: "zmdld11.github.io",
  branch: "main",
  oauthClientId: "",
  /** 自托管 OAuth 回调网关（阿里云 8788，见 gateway/README.md） */
  gatewayUrl: "http://101.133.134.164:8788",
} as const;
