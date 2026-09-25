// 构建期同步 Bangumi「在看」收藏 → src/data/bangumi.json（封面条展示，无运行时请求）
// uid 在常动层 src/content/settings/bangumi.json 配置；拉取失败保留旧数据，不阻塞构建
import { readFile, writeFile } from "node:fs/promises";

const cfg = JSON.parse(
  await readFile(new URL("../src/content/settings/bangumi.json", import.meta.url), "utf8"),
);
const uid = String(cfg.uid ?? "").trim();
if (!uid) {
  console.log("fetch-bangumi: bangumi.json 未配置 uid，跳过");
  process.exit(0);
}

try {
  // type=3 为「在看」；Bangumi API 要求自带 UA
  const res = await fetch(`https://api.bgm.tv/v0/users/${uid}/collections?type=3&limit=20&offset=0`, {
    headers: { "User-Agent": "zmdld11-blog/1.0 (https://zmdld11.github.io)" },
  });
  if (!res.ok) throw new Error(`api ${res.status}`);
  const data = await res.json();
  const items = (data.data ?? [])
    .map((c) => ({
      id: c.subject_id,
      name: c.subject?.name ?? "",
      nameCn: c.subject?.name_cn || c.subject?.name || "",
      cover: c.subject?.images?.common ?? "",
      href: `https://bgm.tv/subject/${c.subject_id}`,
    }))
    .filter((i) => i.cover);
  if (!items.length) throw new Error("在看收藏为空或均为私有");

  await writeFile(
    new URL("../src/data/bangumi.json", import.meta.url),
    JSON.stringify({ uid, items }, null, 2) + "\n",
  );
  console.log(`fetch-bangumi: 同步 ${items.length} 部在看`);
} catch (e) {
  console.warn(`fetch-bangumi: 拉取失败，保留旧数据 —— ${e.message}`);
}
