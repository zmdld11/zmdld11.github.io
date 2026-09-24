// mock-deepseek.mjs — 假 DeepSeek SSE 上游,联调 fortune-server 用
// 收到的 authorization/model/prompt 写入 .fortune-shots/mock-capture.json 供断言
import http from "node:http";
import fs from "node:fs";

const PORT = Number(process.env.MOCK_PORT ?? 9990);
const capturePath = "D:/program_project/MyBlog/.fortune-shots/mock-capture.json";

http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    fs.mkdirSync("D:/program_project/MyBlog/.fortune-shots", { recursive: true });
    fs.writeFileSync(capturePath, JSON.stringify({ auth: req.headers.authorization, body: JSON.parse(body || "{}") }));

    res.writeHead(200, { "content-type": "text/event-stream" });
    const chunks = ["你好", "，这是", "mock 流式回复"];
    let i = 0;
    const timer = setInterval(() => {
      if (i < chunks.length) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunks[i++] } }] })}\n\n`);
      } else {
        res.write("data: [DONE]\n\n");
        clearInterval(timer);
        res.end();
      }
    }, 30);
  });
}).listen(PORT, () => console.log(`mock-deepseek on :${PORT}`));
