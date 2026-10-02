// 主題：light / dark / auto、VditorThemeProvider，以及同一頁混用不同主題
const {setup, waitReady} = require("./util.cjs");

const MARKDOWN = "# 標題\n\n文字\n\n```js\nconst a = 1\n```";
// 內容主題與 highlight.js 主題的實際顏色
const COLOR = {
    light: {text: "rgb(36, 41, 46)", keyword: "rgb(215, 58, 73)"},     // light.css、github
    dark: {text: "rgb(209, 213, 218)", keyword: "rgb(255, 123, 114)"}, // dark.css、github-dark
};
const DARK_PREVIEW_BACKGROUND = "rgb(47, 54, 61)";
const TRANSPARENT = "rgba(0, 0, 0, 0)";

describe("主題", () => {
    let env;

    beforeAll(async () => {
        env = await setup();
    });

    afterAll(async () => {
        await env.close();
    });

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const expectClean = (result) => {
        expect(result.external).toEqual([]);
        expect(result.missing).toEqual([]);
        expect(result.errors).toEqual([]);
    };

    const mount = async (kind, props, options = {}) => {
        const result = await env.openPage();
        if (options.systemDark !== undefined) {
            await result.page.emulateMediaFeatures([{name: "prefers-color-scheme", value: options.systemDark ? "dark" : "light"}]);
        }
        await result.page.evaluate((k, p, o) => window.harness.mount(k, p, o), kind, props, options);
        if (kind !== "preview") {
            await waitReady(result.page);
        }
        await result.page.waitForSelector("#root .react-vditor-preview .vditor-reset, #root .vditor-reset", {timeout: 10000});
        await sleep(800);
        return result;
    };

    /** 讀出編輯器與預覽目前的主題狀態 */
    const read = (page) => page.evaluate(() => {
        const style = (element, property = "color") => (element ? getComputedStyle(element)[property] : null);
        const editor = document.querySelector("#root > .react-vditor--light, #root > .react-vditor--dark");
        const preview = document.querySelector("#root .react-vditor-preview");
        return {
            editor: editor && {
                theme: editor.classList.contains("react-vditor--dark") ? "dark" : "light",
                chromeDark: !!editor.querySelector(".vditor--dark"),
                text: style(editor.querySelector(".vditor-wysiwyg p")),
            },
            preview: preview && {
                theme: preview.classList.contains("react-vditor--dark") ? "dark" : "light",
                background: style(preview, "backgroundColor"),
                text: style(preview.querySelector("p")),
                keyword: style(preview.querySelector(".hljs-keyword")),
            },
            // vditor 原本整頁共用的內容主題 <link> 不應該出現
            contentThemeLink: !!document.getElementById("vditorContentTheme"),
            afterCount: window.harness.events.filter((e) => e[0] === "after").length,
        };
    });

    const expectEditor = (state, theme) => expect(state.editor).toEqual({
        theme, chromeDark: theme === "dark", text: COLOR[theme].text,
    });
    const expectPreview = (state, theme) => expect(state.preview).toEqual({
        theme,
        background: theme === "dark" ? DARK_PREVIEW_BACKGROUND : TRANSPARENT,
        text: COLOR[theme].text,
        keyword: COLOR[theme].keyword,
    });

    it("預設是 light，而且不使用 vditor 整頁共用的內容主題", async () => {
        const result = await mount("pair", {editor: {value: MARKDOWN}, preview: {value: MARKDOWN}});
        const state = await read(result.page);
        expectEditor(state, "light");
        expectPreview(state, "light");
        expect(state.contentThemeLink).toBe(false);
        expectClean(result);
        await result.page.close();
    });

    it("theme=\"dark\"：外框、內容、程式碼一起變深色，預覽帶深色背景", async () => {
        const result = await mount("pair", {editor: {value: MARKDOWN, theme: "dark"}, preview: {value: MARKDOWN, theme: "dark"}});
        const state = await read(result.page);
        expectEditor(state, "dark");
        expectPreview(state, "dark");
        expectClean(result);
        await result.page.close();
    });

    it("同一頁混用：深色編輯器與淺色預覽互不影響", async () => {
        const result = await mount("pair", {editor: {value: MARKDOWN, theme: "dark"}, preview: {value: MARKDOWN, theme: "light"}});
        const state = await read(result.page);
        expectEditor(state, "dark");
        expectPreview(state, "light");
        expectClean(result);
        await result.page.close();
    });

    it("VditorThemeProvider：底下的元件跟著它，切換時不重建編輯器", async () => {
        const result = await mount("pair", {editor: {value: MARKDOWN}, preview: {value: MARKDOWN}}, {provider: "dark"});
        const {page} = result;
        let state = await read(page);
        expectEditor(state, "dark");
        expectPreview(state, "dark");

        await page.evaluate(() => window.harness.setProvider("light"));
        await sleep(500);
        state = await read(page);
        expectEditor(state, "light");
        expectPreview(state, "light");
        expect(state.afterCount).toBe(1);
        expectClean(result);
        await page.close();
    });

    it("元件自己的 theme 比 VditorThemeProvider 優先", async () => {
        const result = await mount("pair", {editor: {value: MARKDOWN}, preview: {value: MARKDOWN, theme: "light"}}, {provider: "dark"});
        const state = await read(result.page);
        expectEditor(state, "dark");
        expectPreview(state, "light");
        await result.page.close();
    });

    it("theme=\"auto\"：跟著作業系統，系統切換時即時更新", async () => {
        const result = await mount("pair", {editor: {value: MARKDOWN}, preview: {value: MARKDOWN}}, {provider: "auto", systemDark: true});
        const {page} = result;
        let state = await read(page);
        expectEditor(state, "dark");
        expectPreview(state, "dark");

        await page.emulateMediaFeatures([{name: "prefers-color-scheme", value: "light"}]);
        await sleep(500);
        state = await read(page);
        expectEditor(state, "light");
        expectPreview(state, "light");
        expect(state.afterCount).toBe(1);
        expectClean(result);
        await page.close();
    });
});
