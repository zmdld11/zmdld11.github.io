// 一次性图片优化：把文章目录里超大图重尺寸+重压缩（覆盖原文件，原图在 quartz-archive 分支可找回）
// 用法：node scripts/optimize-images.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(ROOT, "src", "content", "posts");
const MAX_WIDTH = 1600; // 内容列约 745px，2x 屏 1490px 足够
const TRIGGER_BYTES = 600 * 1024; // 超过 600KB 才处理

async function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) out.push(...(await walk(p)));
    else if (/\.(jpe?g|png|webp)$/i.test(name)) out.push(p);
  }
  return out;
}

const files = await walk(DIR);
for (const file of files) {
  const stat = fs.statSync(file);
  if (stat.size < TRIGGER_BYTES) continue;
  // 先读进内存：Windows 下 sharp 可能仍持有文件句柄，直接覆盖原路径会失败
  const input = fs.readFileSync(file);
  const img = sharp(input);
  const meta = await img.metadata();
  const pipeline = meta.width > MAX_WIDTH ? img.resize({ width: MAX_WIDTH }) : img;
  const isPng = /\.png$/i.test(file);
  const buf = isPng
    ? await pipeline.png({ compressionLevel: 9, palette: true, quality: 85 }).toBuffer()
    : await pipeline.webp({ quality: 82 }).toBuffer();
  if (buf.length < stat.size) {
    fs.writeFileSync(file, buf);
    console.log(
      `✓ ${path.relative(DIR, file)}: ${(stat.size / 1024).toFixed(0)}KB → ${(buf.length / 1024).toFixed(0)}KB${meta.width > MAX_WIDTH ? `（${meta.width}→${Math.min(meta.width, MAX_WIDTH)}px）` : ""}`,
    );
  } else {
    console.log(`- ${path.relative(DIR, file)}: 压缩无收益，跳过`);
  }
}
console.log("done");
