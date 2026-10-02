// 測試共用：提供 test/app/dist 的靜態伺服器，以及會攔下外部請求、記錄 404 與錯誤的分頁
const fs = require("fs");
const http = require("http");
const path = require("path");
const puppeteer = require("puppeteer");

const DIST = path.join(__dirname, "app/dist");
const {buildCss} = require("../scripts/css.cjs");
const TYPES = {".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".gif": "image/gif", ".svg": "image/svg+xml"};

/** puppeteer 下載的瀏覽器；沒下載（例如安裝時略過了 install script）就用系統安裝的 Chrome */
const executablePath = () => {
    try {
        return puppeteer.executablePath();
    } catch {
        return puppeteer.executablePath("chrome");
    }
};

/** 起伺服器與瀏覽器；回傳 openPage() 與 close() */
const setup = async () => {
    const css = buildCss();
    const server = http.createServer((request, response) => {
        const url = decodeURIComponent(request.url.split("?")[0]);
        if (url === "/") {
            response.writeHead(200, {"content-type": "text/html"});
            response.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/vditor.css"></head>
<body><div id="root"></div><script src="/main.js"></script></body></html>`);
            return;
        }
        if (url === "/vditor.css") {
            // 跟 npm run build 產生的 dist/index.css 相同：vditor 的樣式加上局部化的 light / dark 主題
            response.writeHead(200, {"content-type": "text/css"});
            response.end(css);
            return;
        }
        const file = path.join(DIST, url);
        fs.readFile(file, (error, data) => {
            if (error) {
                response.writeHead(404);
                response.end();
                return;
            }
            response.writeHead(200, {"content-type": TYPES[path.extname(file)] || "application/octet-stream"});
            response.end(data);
        });
    });
    await new Promise((resolve) => server.listen(0, resolve));
    const origin = `http://localhost:${server.address().port}`;
    const browser = await puppeteer.launch({executablePath: executablePath(), args: ["--no-sandbox"]});

    /** 開分頁：external 是被擋下的外部請求，missing 是本機 404，errors 是頁面錯誤，warnings 是 console.warn */
    const openPage = async () => {
        const page = await browser.newPage();
        const result = {page, external: [], missing: [], errors: [], warnings: []};
        page.on("pageerror", (error) => result.errors.push(String(error)));
        page.on("console", (message) => ["warn", "warning"].includes(message.type()) && result.warnings.push(message.text()));
        page.on("response", (response) => {
            if (response.status() === 404 && !response.url().endsWith("/favicon.ico")) {
                result.missing.push(response.url().replace(origin, ""));
            }
        });
        await page.setRequestInterception(true);
        page.on("request", (request) => {
            const url = request.url();
            if (url.startsWith(`${origin}/`) || url.startsWith("data:") || url.startsWith("blob:")) {
                request.continue();
                return;
            }
            result.external.push(url);
            request.abort();
        });
        await page.goto(`${origin}/`, {waitUntil: "load"});
        return result;
    };

    const close = async () => {
        await browser.close();
        await new Promise((resolve) => server.close(resolve));
    };
    return {openPage, close};
};

/** 等編輯器觸發 after */
const waitReady = (page, count = 1) => page.waitForFunction(
    (n) => window.harness.events.filter((event) => event[0] === "after").length >= n, {timeout: 15000}, count);

/** 同時含 GFM 與非 GFM 語法的內容 */
const MIXED = [
    "# 標題", "", "**粗體** ~~刪除~~ 行內 $x^2$", "", "- [x] 任務", "", "| a | b |", "| - | - |", "| 1 | 2 |", "",
    "```js", "const a = 1", "```", "", "$$", "E=mc^2", "$$", "",
    "```mermaid", "graph TD", "A-->B", "```", "", "```echarts", "{}", "```", "", "```graphviz", "digraph { a -> b }", "```", "",
    "```abc", "X:1", "K:C", "CDEF|", "```", "", "```markmap", "# a", "```", "", "```plantuml", "@startuml", "A -> B", "@enduml", "```", "",
    "註腳[^1]", "", "[^1]: n",
].join("\n");

module.exports = {setup, waitReady, MIXED};
