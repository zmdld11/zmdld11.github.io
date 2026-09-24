// 构建期取数：GitHub 公开动态 → src/data/events.json（作为页面初始数据，客户端再刷新）
// 用 GITHUB_TOKEN（Actions 内置）认证可享 5000 次/时，规避匿名限流
// 无 token / 失败时保留现有数据并退出 0
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "../src/data/events.json");
const LOGIN = "zmdld11";
const token = process.env.GITHUB_TOKEN;
const headers = token ? { Authorization: `Bearer ${token}` } : {};

try {
  const res = await fetch(
    `https://api.github.com/users/${LOGIN}/events/public?per_page=30`,
    { headers },
  );
  if (!res.ok) {
    console.warn(`[events] HTTP ${res.status}，跳过（保留现有数据）`);
    process.exit(0);
  }
  const data = await res.json();
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      { login: LOGIN, fetchedAt: new Date().toISOString(), events: data },
      null,
      2,
    ),
  );
  console.log(`[events] ✓ ${data.length} 条公开事件`);
} catch (e) {
  console.warn("[events] 取数失败（保留现有数据）：", e.message);
  process.exit(0);
}
