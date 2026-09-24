// shoot-fortune.mjs — 用本机 Edge 无头截图算命页面(视觉验收用,临时脚本)
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const dir = "D:/program_project/MyBlog/.fortune-shots";
fs.mkdirSync(dir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--no-sandbox", "--window-size=1280,900", "--disable-features=Translate,TranslateUI,EdgeTranslate", "--no-first-run", "--disable-features=msSmartScreen"],
  defaultViewport: { width: 1280, height: 900 },
});

const page = await browser.newPage();
await page.goto("http://localhost:4321/fortune/", { waitUntil: "networkidle2" });

// 勾选模块 + 填表 + 摇卦 + 排盘
await page.evaluate(() => {
  const want = ["西方占星本命盘", "八字四柱", "塔罗", "六爻纳甲"];
  for (const el of document.querySelectorAll("#f-cats .f-chip")) {
    const input = el.querySelector("input");
    input.checked = want.some((w) => el.textContent.includes(w));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
  document.querySelector("#f-date").value = "1990-06-15";
  document.querySelector("#f-date").dispatchEvent(new Event("change"));
  document.getElementById("f-dst").checked = false;
  document.querySelector("#f-time").value = "08:30";
  document.querySelector("#f-question").value = "最近的事业方向该怎么选？";
  for (let i = 0; i < 6; i++) document.getElementById("f-toss-btn").click();
  document.getElementById("f-run").click();
});
await new Promise((r) => setTimeout(r, 1800));

// 隐藏全站悬浮播放条(站点级固定控件,非本页内容,避免元素截图被烙印)
await page.evaluate(() => { const p = document.getElementById("mini-player"); if (p) p.style.display = "none"; });
// 顶部
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 300));
fs.writeFileSync(`${dir}/1-top.png`, await page.screenshot());

// 三张结果卡区域:元素截图会被 Edge 翻译工具条烙印,改 clip + captureBeyondViewport(无浏览器UI合成)
const mods = await page.$$(".f-mod");
const names = ["2-result-western", "3-result-bazi", "4-result-liuyao", "5-result-tarot"];
for (let i = 0; i < Math.min(mods.length, 4); i++) {
  const box = await mods[i].boundingBox();
  await page.screenshot({
    path: `${dir}/${names[i]}.png`,
    clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: box.width + 16, height: box.height + 16 },
    captureBeyondViewport: true,
  });
}

// 暗色主题整页
await page.evaluate(() => {
  document.documentElement.setAttribute("data-theme", "dark");
});
await new Promise((r) => setTimeout(r, 400));
fs.writeFileSync(`${dir}/6-dark-full.png`, await page.screenshot({ fullPage: true }));

// 首页入口卡(同样用 clip 避开浏览器UI)
await page.goto("http://localhost:4321/", { waitUntil: "networkidle2" });
const card = await page.$(".fortune-card");
if (card) {
  const cb = await card.boundingBox();
  await page.screenshot({
    path: `${dir}/7-home-card.png`,
    clip: { x: Math.max(0, cb.x - 8), y: Math.max(0, cb.y - 8), width: cb.width + 16, height: cb.height + 16 },
    captureBeyondViewport: true,
  });
}
// 移动端宽度
await page.setViewport({ width: 390, height: 844 });
await page.goto("http://localhost:4321/fortune/", { waitUntil: "networkidle2" });
await new Promise((r) => setTimeout(r, 500));
fs.writeFileSync(`${dir}/8-mobile-top.png`, await page.screenshot());

await browser.close();
console.log("shots:", fs.readdirSync(dir).join(", "));
