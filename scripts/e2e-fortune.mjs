// e2e-fortune.mjs — 端到端联调:勾选→本地排盘→线上 Worker AI 流式(浏览器走本机代理)
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const dir = "D:/program_project/MyBlog/.fortune-shots";
fs.mkdirSync(dir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: [
    "--no-sandbox", "--window-size=1280,900",
    "--disable-features=Translate,TranslateUI,EdgeTranslate,msSmartScreen",
    "--no-first-run",
    "--proxy-server=http://127.0.0.1:7890",
  ],
  defaultViewport: { width: 1280, height: 900 },
});

const page = await browser.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

await page.goto("http://localhost:4321/fortune/", { waitUntil: "networkidle2" });

// cfg.api 是否注入
const api = await page.evaluate(() => JSON.parse(document.getElementById("fortune-cfg").textContent).api);
console.log("cfg.api =", api || "(空! 未注入)");

// 勾选两个模块 + 填出生信息 + 本地排盘
await page.evaluate(() => {
  const want = ["西方占星本命盘", "八字四柱"];
  for (const el of document.querySelectorAll("#f-cats .f-chip")) {
    const input = el.querySelector("input");
    input.checked = want.some((w) => el.textContent.includes(w));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
  document.querySelector("#f-date").value = "1990-06-15";
  document.querySelector("#f-date").dispatchEvent(new Event("change"));
  document.querySelector("#f-time").value = "11:30";
  document.querySelector("#f-question").value = "联调测试：用三句话概括我的性格底色。";
  document.getElementById("f-run").click();
});
await page.waitForFunction(() => document.getElementById("f-result").innerText.length > 150, { timeout: 15000 });

const chart = await page.evaluate(() => {
  const r = document.getElementById("f-result");
  return {
    dst: document.getElementById("f-dst").checked,
    text: r.innerText,
  };
});
console.log("=== 本地排盘 ===");
console.log("夏令时自动勾选:", chart.dst, "| 盘面字数:", chart.text.length);
const fourPillars = chart.text.match(/(庚午|壬午|辛亥|甲午)/g);
console.log("四柱匹配:", [...new Set(fourPillars ?? [])].join(" "));

// AI 解读(走线上 Worker)
const aiVisible = await page.evaluate(() => {
  const b = document.getElementById("f-ai");
  return b && !b.hidden;
});
if (!aiVisible) { console.log("!! AI 按钮未出现 — cfg.api 未生效"); await browser.close(); process.exit(1); }
await page.evaluate(() => { document.getElementById("f-ai").click(); window.scrollTo(0, document.body.scrollHeight); });
console.log("=== AI 流式生成中(等待完成态) ===");
await page.waitForFunction(() => {
  const n = document.querySelector("#f-ai-card .f-ai-note");
  return n && (n.textContent.includes("完成") || n.textContent.includes("失败"));
}, { timeout: 180000, polling: 800 });

const ai = await page.evaluate(() => ({
  note: document.querySelector("#f-ai-card .f-ai-note").textContent,
  text: document.getElementById("f-ai-text").innerText,
}));
console.log("AI 状态:", ai.note.trim(), "| 正文", ai.text.length, "字");
console.log("=== AI 正文节选 ===");
console.log(ai.text.slice(0, 420));

// 完成态截图(AI 卡片区域)
await page.evaluate(() => document.getElementById("f-ai-card").scrollIntoView({ block: "center" }));
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: dir + "/e2e-final.png", clip: { x: 0, y: 0, width: 1280, height: 900 } });

console.log("=== 浏览器控制台错误 ===");
console.log(errors.length ? errors.join("\n") : "无");
await browser.close();
