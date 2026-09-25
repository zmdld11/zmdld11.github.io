// 构建期同步网易云公开歌单 → src/data/netease.json（播放走官方外链 outer/url，零部署零凭据）
// 歌单 ID 在常动层 src/content/settings/music.json 配置；拉取失败保留旧数据，不阻塞构建
import { readFile, writeFile } from "node:fs/promises";

const UA_HEADERS = { "User-Agent": "Mozilla/5.0", Referer: "https://music.163.com/" };
const cfg = JSON.parse(
  await readFile(new URL("../src/content/settings/music.json", import.meta.url), "utf8"),
);
const id = String(cfg.neteasePlaylistId ?? "").trim();
if (!id) {
  console.log("fetch-netease: music.json 未配置 neteasePlaylistId，跳过");
  process.exit(0);
}

try {
  // 歌单详情：trackIds 是全量，tracks 字段可能被截断，所以拿 ids 再批量查详情
  const pl = await fetch(`https://music.163.com/api/v6/playlist/detail?id=${id}&n=1000`, {
    headers: UA_HEADERS,
  }).then((r) => r.json());
  if (pl.code !== 200 || !pl.playlist) throw new Error(`playlist api code=${pl.code}`);
  const ids = (pl.playlist.trackIds ?? []).map((t) => t.id).filter(Boolean);
  if (!ids.length) throw new Error("歌单为空");

  const tracks = [];
  for (let i = 0; i < ids.length; i += 900) {
    const batch = ids.slice(i, i + 900);
    const det = await fetch("https://music.163.com/api/v3/song/detail", {
      method: "POST",
      headers: { ...UA_HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
      body: `c=${encodeURIComponent(JSON.stringify(batch.map((sid) => ({ id: sid }))))}`,
    }).then((r) => r.json());
    if (det.code !== 200 || !Array.isArray(det.songs)) throw new Error(`song detail api code=${det.code}`);
    for (const s of det.songs) {
      tracks.push({
        id: s.id,
        title: s.name,
        artist: (s.ar ?? s.artists ?? []).map((a) => a.name).join(" / "),
      });
    }
  }

  await writeFile(
    new URL("../src/data/netease.json", import.meta.url),
    JSON.stringify({ source: "netease", playlistId: id, name: pl.playlist.name ?? "", tracks }, null, 2) + "\n",
  );
  console.log(`fetch-netease: 同步 ${tracks.length} 首（${pl.playlist.name ?? id}）`);
} catch (e) {
  console.warn(`fetch-netease: 拉取失败，保留旧数据 —— ${e.message}`);
}
