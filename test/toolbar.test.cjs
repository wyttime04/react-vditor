// 預設工具列與 upload-image 按鈕
const fs = require("fs");
const os = require("os");
const path = require("path");
const {setup, waitReady} = require("./util.cjs");

const TOOLBAR = [
    "headings", "bold", "italic", "strike", "link",
    "list", "ordered-list", "check", "outdent", "indent",
    "quote", "line", "code", "inline-code", "insert-before", "insert-after",
    "upload-image", "table",
    "undo", "redo",
    "fullscreen", "edit-mode",
    "more",
];
const MORE = ["both", "outline", "preview"];

describe("工具列", () => {
    let env;
    let files;

    beforeAll(async () => {
        env = await setup();
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), "react-vditor-"));
        files = {png: path.join(dir, "a.png"), png2: path.join(dir, "c.png"), txt: path.join(dir, "b.txt")};
        fs.writeFileSync(files.png, Buffer.from("89504e470d0a1a0a", "hex"));
        fs.writeFileSync(files.png2, Buffer.from("89504e470d0a1a0a", "hex"));
        fs.writeFileSync(files.txt, "hello");
    });

    afterAll(async () => {
        await env.close();
    });

    const mountEditor = async (props, options) => {
        const result = await env.openPage();
        await result.page.evaluate((p, o) => window.harness.mount("editor", p, o), props, options);
        await waitReady(result.page);
        return result;
    };

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    /** 按 upload-image，在檔案選擇框選 files */
    const pick = async (page, ...paths) => {
        const [chooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('.vditor-toolbar [data-type="upload-image"]'),
        ]);
        await chooser.accept(paths);
        await sleep(800);
    };

    const uploads = (page) => page.evaluate(() => window.harness.events.filter((e) => e[0] === "upload").map((e) => e[1]));
    const tipText = (page) => page.evaluate(() => document.querySelector(".vditor-tip")?.innerText || "");

    it("預設工具列", async () => {
        const result = await mountEditor({value: ""});
        const types = await result.page.evaluate(() => ({
            top: [...document.querySelectorAll(".vditor-toolbar > .vditor-toolbar__item > [data-type]")].map((e) => e.dataset.type),
            more: [...document.querySelectorAll('.vditor-toolbar [data-type="more"] ~ .vditor-hint [data-type]')].map((e) => e.dataset.type),
        }));
        expect(types).toEqual({top: TOOLBAR, more: MORE});
        await result.page.close();
    });

    it("upload-image 的 tip 跟著語言，換語言重建後也跟著換", async () => {
        const result = await mountEditor({value: "", lang: "zh_TW"});
        const {page} = result;
        const tip = () => page.evaluate(() =>
            document.querySelector('.vditor-toolbar [data-type="upload-image"]').getAttribute("aria-label"));
        expect(await tip()).toBe("上傳圖片");
        await page.evaluate(() => window.harness.update({lang: "en_US"}));
        await waitReady(page, 2);
        expect(await tip()).toBe("Upload image");
        await page.close();
    });

    it("upload-image：選圖片會交給 upload.handler，非圖片會被擋下", async () => {
        const result = await mountEditor({value: ""}, {recordUpload: true});
        const {page} = result;
        await pick(page, files.png);
        await pick(page, files.txt);
        expect(await uploads(page)).toEqual([["a.png"]]);
        expect(result.errors).toEqual([]);
        expect(result.external).toEqual([]);
        await page.close();
    });

    it.each([
        ["預設（true）", {}, true],
        ["false", {multiple: false}, false],
    ])("upload-image：upload.multiple %s 時，檔案選擇框能不能多選", async (_, upload, multiple) => {
        const result = await mountEditor({value: "", upload}, {recordUpload: true});
        const {page} = result;
        const [chooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('.vditor-toolbar [data-type="upload-image"]'),
        ]);
        expect(chooser.isMultiple()).toBe(multiple);
        await chooser.accept(multiple ? [files.png, files.png2] : [files.png]);
        await sleep(800);
        expect(await uploads(page)).toEqual([multiple ? ["a.png", "c.png"] : ["a.png"]]);
        await page.close();
    });

    it("upload-image：handler 回傳字串時顯示成提示", async () => {
        const result = await mountEditor({value: ""}, {recordUpload: "檔案太大"});
        const {page} = result;
        await pick(page, files.png);
        expect(await tipText(page)).toContain("檔案太大");
        await page.close();
    });

    it("upload-image：沒設 upload.handler 時提示要設定，不開檔案選擇框", async () => {
        const result = await mountEditor({value: ""});
        const {page} = result;
        const chooser = page.waitForFileChooser({timeout: 1000}).then(() => true, () => false);
        await page.click('.vditor-toolbar [data-type="upload-image"]');
        expect(await chooser).toBe(false);
        expect(await tipText(page)).toContain("options.upload.handler");
        await page.close();
    });

    it("upload-image：使用端在物件裡給的欄位優先", async () => {
        const result = await mountEditor({value: "", toolbar: [{name: "upload-image", tip: "自訂文字"}, "bold"]});
        const tip = await result.page.evaluate(() =>
            document.querySelector('.vditor-toolbar [data-type="upload-image"]').getAttribute("aria-label"));
        expect(tip).toBe("自訂文字");
        await result.page.close();
    });
});
