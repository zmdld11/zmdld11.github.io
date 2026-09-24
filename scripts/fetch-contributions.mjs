// 构建期取数：GitHub 贡献热力图 → src/data/contributions.json
// 用法：CONTRIBUTIONS_TOKEN=xxx node scripts/fetch-contributions.mjs
// 无 token / 调用失败时保留现有数据并退出 0（CI 不因缺 Secret 而红）
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "../src/data/contributions.json");
const LOGIN = "zmdld11";
const token = process.env.CONTRIBUTIONS_TOKEN;

if (!token) {
  console.warn("[contributions] 未提供 CONTRIBUTIONS_TOKEN，跳过（保留现有数据）");
  process.exit(0);
}

const query = `
query ($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
    }
  }
}`;

try {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login: LOGIN } }),
  });
  const json = await res.json();
  if (json.errors || !json.data?.user) {
    console.warn("[contributions] GraphQL 返回异常：", JSON.stringify(json.errors ?? json).slice(0, 300));
    process.exit(0);
  }
  const cc = json.data.user.contributionsCollection.contributionCalendar;
  const days = cc.weeks
    .flatMap((w) => w.contributionDays)
    .map((d) => ({ date: d.date, count: d.contributionCount, color: d.color }));
  fs.writeFileSync(
    OUT,
    JSON.stringify({ login: LOGIN, generatedAt: new Date().toISOString(), total: cc.totalContributions, days }, null, 2),
  );
  console.log(`[contributions] ✓ ${days.length} 天 / 总计 ${cc.totalContributions} 次贡献`);
} catch (e) {
  console.warn("[contributions] 取数失败（保留现有数据）：", e.message);
  process.exit(0);
}
