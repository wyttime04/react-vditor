// 元件行為，React 16.9
const {setup, waitReady, MIXED} = require("./util.cjs");

const METHODS = [
    "updateToolbarConfig", "focus", "blur", "disabled", "enable", "renderPreview",
    "clearCache", "disabledCache", "enableCache", "tip", "setPreviewMode", "deleteValue", "updateValue",
    "insertValue", "insertMD", "setValue", "insertEmptyBlock", "clearStack",
    "hlCommentIds", "unHlCommentIds", "removeCommentIds",
    "getValue", "getCurrentMode", "getSelection", "getCursorPosition", "isUploading",
    "html2md", "exportJSON", "getHTML", "getCommentIds",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("React 16.9", () => {
    let env;

    beforeAll(async () => {
        env = await setup();
    });

    afterAll(async () => {
        await env.close();
    });

    /** 零外部請求、無 404、無頁面錯誤 */
    const expectClean = (result) => {
        expect(result.external).toEqual([]);
        expect(result.missing).toEqual([]);
        expect(result.errors).toEqual([]);
    };

    const mountEditor = async (props, options) => {
        const result = await env.openPage();
        await result.page.evaluate((p, o) => window.harness.mount("editor", p, o), props, options);
        await waitReady(result.page);
        return result;
    };

    it("載入的是 React 16.9", async () => {
        const result = await env.openPage();
        expect(await result.page.evaluate(() => window.harness.reactVersion)).toBe("16.9.0");
        await result.page.close();
    });

    it("VditorPreview：GFM 正常渲染，非 GFM 區塊變成普通程式碼區塊", async () => {
        const result = await env.openPage();
        const {page} = result;
        await page.evaluate((md) => window.harness.mount("preview", {value: md}), MIXED);
        await page.waitForSelector("#root table");
        await page.waitForNetworkIdle({idleTime: 500});

        const info = await page.evaluate(() => {
            const root = document.getElementById("root");
            return {
                table: !!root.querySelector("table"),
                task: !!root.querySelector("input[type=checkbox]"),
                highlighted: !!root.querySelector("code.hljs"),
                languages: [...root.querySelectorAll("pre > code[data-lang]")].map((code) => code.dataset.lang).sort(),
                inlineMath: root.innerText.includes("行內 $x^2$"),
                footnote: !!root.querySelector("sup.footnotes-ref"),
            };
        });
        expect(info).toEqual({
            table: true, task: true, highlighted: true,
            languages: ["abc", "echarts", "graphviz", "markmap", "math", "mermaid", "plantuml"],
            inlineMath: true, footnote: false,
        });
        expectClean(result);
        await page.close();
    });

    it("md2html：回傳的 HTML 一樣把非 GFM 區塊轉成程式碼區塊", async () => {
        const result = await env.openPage();
        const html = await result.page.evaluate((md) => window.harness.md2html(md), MIXED);
        expect(html).toContain('<code class="language-plaintext" data-lang="mermaid">');
        expect(html).not.toContain('<div class="language-mermaid">');
        expect(html).toContain("$x^2$");
        expectClean(result);
        await result.page.close();
    });

    it.each(["ir", "wysiwyg", "sv"])("%s 編輯器：打字觸發 input，內容與行內數學式原樣保留", async (mode) => {
        const result = await mountEditor({mode, value: MIXED});
        const {page} = result;
        await page.evaluate(() => window.harness.ref().focus());
        await page.keyboard.type("OK");
        await page.waitForFunction(() => window.harness.events.some((e) => e[0] === "input" && e[1].includes("OK")));
        await page.waitForNetworkIdle({idleTime: 500});

        const value = await page.evaluate(() => window.harness.ref().getValue());
        expect(value).toContain("行內 $x^2$");
        expect(value).toContain("```mermaid\ngraph TD\nA-->B\n```");
        expectClean(result);
        await page.close();
    });

    it("ready 前透過 ref 呼叫的方法會排隊，ready 後依序執行", async () => {
        const result = await env.openPage();
        const {page} = result;
        const before = await page.evaluate(() => {
            window.harness.mount("editor", {value: "初始"});
            window.harness.ref().setValue("排隊一");
            window.harness.ref().insertValue("排隊二");
            return window.harness.ref().getValue();
        });
        expect(before).toBe("初始");
        await waitReady(page);
        const after = await page.evaluate(() => window.harness.ref().getValue());
        expect(after).toContain("排隊一");
        expect(after).toContain("排隊二");
        expectClean(result);
        await page.close();
    });

    it("StrictMode：只留下一個可用的編輯器", async () => {
        const result = await mountEditor({value: "strict"}, {strict: true});
        const {page} = result;
        await sleep(1000);
        expect(await page.evaluate(() => document.querySelectorAll("#root .vditor").length)).toBe(1);
        await page.evaluate(() => window.harness.ref().focus());
        await page.keyboard.type("OK");
        await page.waitForFunction(() => window.harness.events.some((e) => e[0] === "input" && e[1].includes("OK")));
        expectClean(result);
        await page.close();
    });

    // React 18 以上的 StrictMode 會「掛載 → 卸載 → 再掛載」；React 16 不會，所以直接模擬這個順序
    it("ready 前卸載後立刻重新掛載：只留下一個可用的編輯器", async () => {
        const result = await env.openPage();
        const {page} = result;
        await page.evaluate(() => {
            window.harness.mount("editor", {value: "first"});
            window.harness.unmount();
            window.harness.mount("editor", {value: "second"});
        });
        await waitReady(page);
        await sleep(1000);
        expect(await page.evaluate(() => document.querySelectorAll("#root .vditor").length)).toBe(1);
        expect(await page.evaluate(() => window.harness.events.filter((e) => e[0] === "after").length)).toBe(1);
        await page.evaluate(() => window.harness.ref().focus());
        await page.keyboard.type("OK");
        await page.waitForFunction(() => window.harness.events.some((e) => e[0] === "input" && e[1].includes("OK")));
        expect(await page.evaluate(() => window.harness.ref().getValue())).toContain("second");
        expectClean(result);
        await page.close();
    });

    it("unmount：ready 後卸載會 destroy 並清空容器", async () => {
        const result = await mountEditor({value: "x"});
        const {page} = result;
        await page.evaluate(() => window.harness.unmount());
        expect(await page.evaluate(() => document.getElementById("root").innerHTML)).toBe("");
        expectClean(result);
        await page.close();
    });

    it("unmount：ready 前就卸載也不會出錯、不留下編輯器", async () => {
        const result = await env.openPage();
        const {page} = result;
        await page.evaluate(() => {
            window.harness.mount("editor", {value: "x"});
            window.harness.unmount();
        });
        await sleep(3000);
        expect(await page.evaluate(() => document.getElementById("root").innerHTML)).toBe("");
        expect(await page.evaluate(() => document.querySelectorAll(".vditor").length)).toBe(0);
        expectClean(result);
        await page.close();
    });

    it("預設 mode 是 wysiwyg", async () => {
        const result = await mountEditor({value: "x"});
        expect(await result.page.evaluate(() => window.harness.ref().getCurrentMode())).toBe("wysiwyg");
        expect(await result.page.evaluate(() => !!document.querySelector("#root .vditor-wysiwyg"))).toBe(true);
        await result.page.close();
    });

    it("ref 的方法名稱與原生相同", async () => {
        const result = await mountEditor({value: "x"});
        const types = await result.page.evaluate((names) => names.map((name) => typeof window.harness.ref()[name]), METHODS);
        expect(types).toEqual(METHODS.map(() => "function"));
        await result.page.close();
    });

    it("mode 變動：重建編輯器，內容保留", async () => {
        const result = await mountEditor({mode: "ir", value: "原本"});
        const {page} = result;
        await page.evaluate(() => {
            window.harness.ref().setValue("改過的內容");
            window.harness.update({mode: "sv"});
        });
        await waitReady(page, 2);
        const info = await page.evaluate(() => ({
            mode: window.harness.ref().getCurrentMode(),
            value: window.harness.ref().getValue(),
            editors: document.querySelectorAll("#root .vditor").length,
        }));
        expect(info.mode).toBe("sv");
        expect(info.value).toContain("改過的內容");
        expect(info.editors).toBe(1);
        expectClean(result);
        await page.close();
    });

    it("value 變動：套用到編輯器，不重建", async () => {
        const result = await mountEditor({value: "一"});
        const {page} = result;
        await page.evaluate(() => window.harness.update({value: "二"}));
        await sleep(500);
        expect(await page.evaluate(() => window.harness.ref().getValue())).toContain("二");
        expect(await page.evaluate(() => window.harness.events.filter((e) => e[0] === "after").length)).toBe(1);
        expectClean(result);
        await page.close();
    });

    it("受控用法：連續打字不會被 value 蓋回去", async () => {
        const result = await mountEditor({value: ""}, {controlled: true});
        const {page} = result;
        await page.evaluate(() => window.harness.ref().focus());
        await page.keyboard.type("abcdefghij");
        await sleep(1500);
        expect(await page.evaluate(() => window.harness.ref().getValue())).toContain("abcdefghij");
        expectClean(result);
        await page.close();
    });

    it("受控用法：value 晚到、多個回音疊在一起時，也不會被蓋回去", async () => {
        // undoDelay: 0 讓每個字都觸發 input；使用端 150ms 後才傳回 value，回音會落後好幾個字
        const result = await mountEditor({value: "", undoDelay: 0}, {controlled: true, echoDelay: 150});
        const {page} = result;
        await page.evaluate(() => window.harness.ref().focus());
        await page.keyboard.type("abcdefghij", {delay: 40});
        await sleep(1500);
        const inputs = await page.evaluate(() => window.harness.events.filter((e) => e[0] === "input").length);
        expect(inputs).toBeGreaterThan(1);   // 確認真的有多個回音疊在一起，否則這個測試沒有意義
        expect(await page.evaluate(() => window.harness.ref().getValue())).toContain("abcdefghij");
        expectClean(result);
        await page.close();
    });

    it("theme 變動：套用 setTheme", async () => {
        const result = await mountEditor({value: "x"});
        const {page} = result;
        await page.evaluate(() => window.harness.update({theme: "dark"}));
        // useEffect 在 React 16 是非同步執行的，等它套用
        await page.waitForSelector("#root .vditor--dark", {timeout: 3000}).catch(() => null);
        expect(await page.evaluate(() => !!document.querySelector("#root .vditor--dark"))).toBe(true);
        await page.close();
    });

    it("其他 props 變動：不重建，開發模式下警告一次", async () => {
        const result = await mountEditor({value: "x", placeholder: "a"});
        const {page} = result;
        await page.evaluate(() => window.harness.update({placeholder: "b"}));
        await page.evaluate(() => window.harness.update({placeholder: "c"}));
        await sleep(300);
        expect(result.warnings.filter((text) => text.includes('prop "placeholder"')).length).toBe(1);
        expect(await page.evaluate(() => window.harness.events.filter((e) => e[0] === "after").length)).toBe(1);
        await page.close();
    });
});
