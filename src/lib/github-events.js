// GitHub 公开事件 → 展示条目映射（构建期脚本与客户端脚本共用）
export function mapEvents(data, limit = 6) {
  const ACTION_CN = {
    created: "开了",
    closed: "关闭了",
    reopened: "重开了",
    edited: "编辑了",
    published: "发布了",
  };
  const out = [];
  for (const e of data ?? []) {
    const repo = e.repo?.name?.replace(/^zmdld11\//, "") ?? "";
    const p = e.payload ?? {};
    let icon, text;
    switch (e.type) {
      case "PushEvent": {
        const n = p.size ?? p.commits?.length ?? 1;
        icon = "⬆️";
        text = `push 到 ${repo}：${n} commit${n > 1 ? "s" : ""}`;
        break;
      }
      case "WatchEvent":
        icon = "⭐";
        text = `star 了 ${repo}`;
        break;
      case "IssuesEvent":
        icon = "🦑";
        text = `${ACTION_CN[p.action] ?? p.action} issue：${repo}#${p.issue?.number ?? ""} ${p.issue?.title ?? ""}`;
        break;
      case "PullRequestEvent":
        icon = "🔀";
        text = `${ACTION_CN[p.action] ?? p.action} PR：${repo}#${p.pull_request?.number ?? ""} ${p.pull_request?.title ?? ""}`;
        break;
      case "CreateEvent":
        icon = "🎉";
        text =
          p.ref_type === "repository"
            ? `创建了新仓库 ${repo}`
            : `创建了 ${p.ref_type} ${p.ref ?? ""}`;
        break;
      case "ReleaseEvent":
        icon = "🚀";
        text = `发布了 ${p.release?.tag_name ?? ""} @ ${repo}`;
        break;
      default:
        continue;
    }
    out.push({ icon, text: text.trim(), time: e.created_at, iso: e.created_at });
    if (out.length >= limit) break;
  }
  return out;
}

export function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}
