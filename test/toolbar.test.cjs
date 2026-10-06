// 預設工具列、upload 按鈕與拖曳／貼上的檔案過濾
const fs = require("fs");
const os = require("os");
const path = require("path");
const {setup, waitReady} = require("./util.cjs");

const TOOLBAR = [
    "headings", "bold", "italic", "strike", "link",
    "list", "ordered-list", "check", "outdent", "indent",
    "quote", "line", "code", "inline-code", "insert-before", "insert-after",
    "upload", "table",
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

    /** 按 upload，在檔案選擇框選 files */
    const pick = async (page, ...paths) => {
        const [chooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('.vditor-toolbar [data-type="upload"] input'),
        ]);
        await chooser.accept(paths);
        await sleep(800);
    };

    const uploads = (page) => page.evaluate(() => window.harness.events.filter((e) => e[0] === "upload").map((e) => e[1]));
    const tipText = (page) => page.evaluate(() => document.querySelector(".vditor-tip")?.innerText || "");

    /** 在編輯區拖放（drop）或貼上（paste）檔案，用 DataTransfer 模擬 */
    const transfer = async (page, type, names) => {
        await page.evaluate((t, ns) => {
            const MIME = {png: "image/png", jpg: "image/jpeg", pdf: "application/pdf", txt: "text/plain"};
            const data = new DataTransfer();
            ns.forEach((name) => data.items.add(new File(["x"], name, {type: MIME[name.split(".").pop()]})));
            const event = t === "drop"
                ? new DragEvent("drop", {dataTransfer: data, bubbles: true, cancelable: true})
                : new ClipboardEvent("paste", {clipboardData: data, bubbles: true, cancelable: true});
            document.querySelector(".vditor-wysiwyg .vditor-reset").dispatchEvent(event);
        }, type, names);
        await sleep(800);
    };

    it("預設工具列", async () => {
        const result = await mountEditor({value: ""});
        const types = await result.page.evaluate(() => ({
            top: [...document.querySelectorAll(".vditor-toolbar > .vditor-toolbar__item > [data-type]")].map((e) => e.dataset.type),
            more: [...document.querySelectorAll('.vditor-toolbar [data-type="more"] ~ .vditor-hint [data-type]')].map((e) => e.dataset.type),
        }));
        expect(types).toEqual({top: TOOLBAR, more: MORE});
        await result.page.close();
    });

    it("upload 的 tip：imageOnly 時為「上傳圖片」並跟著語言，imageOnly 為 false 時為「上傳圖片或文件」", async () => {
        const result = await mountEditor({value: "", lang: "zh_TW"});
        const {page} = result;
        const tip = () => page.evaluate(() =>
            document.querySelector('.vditor-toolbar [data-type="upload"]').getAttribute("aria-label"));
        expect(await tip()).toBe("上傳圖片");
        await page.evaluate(() => window.harness.update({lang: "en_US"}));
        await waitReady(page, 2);
        expect(await tip()).toBe("Upload image");
        await page.evaluate(() => window.harness.update({lang: "zh_TW", upload: {imageOnly: false}}));
        await waitReady(page, 3);
        expect(await tip()).toBe("上傳圖片或文件");
        await page.close();
    });

    it.each([
        ["預設", {}, "image/*"],
        ["imageOnly 且指定 accept", {accept: "image/png"}, "image/png"],
        ["imageOnly 為 false", {imageOnly: false}, null],
    ])("upload：檔案選擇框的 accept（%s）", async (_, upload, accept) => {
        const result = await mountEditor({value: "", upload});
        expect(await result.page.evaluate(() =>
            document.querySelector('.vditor-toolbar [data-type="upload"] input').getAttribute("accept"))).toBe(accept);
        await result.page.close();
    });

    it("upload：選圖片會交給 upload.handler，非圖片會被擋下", async () => {
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
    ])("upload：upload.multiple %s 時，檔案選擇框能不能多選", async (_, upload, multiple) => {
        const result = await mountEditor({value: "", upload}, {recordUpload: true});
        const {page} = result;
        const [chooser] = await Promise.all([
            page.waitForFileChooser(),
            page.click('.vditor-toolbar [data-type="upload"] input'),
        ]);
        expect(chooser.isMultiple()).toBe(multiple);
        await chooser.accept(multiple ? [files.png, files.png2] : [files.png]);
        await sleep(800);
        expect(await uploads(page)).toEqual([multiple ? ["a.png", "c.png"] : ["a.png"]]);
        await page.close();
    });

    it("upload：handler 回傳字串時顯示成提示", async () => {
        const result = await mountEditor({value: ""}, {recordUpload: "檔案太大"});
        const {page} = result;
        await pick(page, files.png);
        expect(await tipText(page)).toContain("檔案太大");
        await page.close();
    });

    it("upload：使用端在物件裡給的 tip 優先", async () => {
        const result = await mountEditor({value: "", toolbar: [{name: "upload", tip: "自訂文字"}, "bold"]});
        const tip = await result.page.evaluate(() =>
            document.querySelector('.vditor-toolbar [data-type="upload"]').getAttribute("aria-label"));
        expect(tip).toBe("自訂文字");
        await result.page.close();
    });

    it.each(["drop", "paste"])("%s：只把圖片交給 upload.handler", async (type) => {
        const result = await mountEditor({value: ""}, {recordUpload: true});
        const {page} = result;
        await transfer(page, type, ["a.png", "b.pdf", "c.txt"]);
        expect(await uploads(page)).toEqual([["a.png"]]);
        expect(result.errors).toEqual([]);
        await page.close();
    });

    it("drop：沒有圖片時不呼叫 upload.handler，提示檔案類型不允許", async () => {
        const result = await mountEditor({value: ""}, {recordUpload: true});
        const {page} = result;
        await transfer(page, "drop", ["b.pdf"]);
        expect(await uploads(page)).toEqual([]);
        expect(await tipText(page)).toContain("檔案類型不允許上傳");
        await page.close();
    });

    it("drop：imageOnly 時，accept 只能從圖片中再限縮", async () => {
        const result = await mountEditor({value: "", upload: {accept: "image/png,.pdf"}}, {recordUpload: true});
        const {page} = result;
        await transfer(page, "drop", ["a.png", "d.jpg", "b.pdf"]);
        expect(await uploads(page)).toEqual([["a.png"]]);
        await page.close();
    });

    it("drop：imageOnly 為 false 且沒設 accept 時不限制", async () => {
        const result = await mountEditor({value: "", upload: {imageOnly: false}}, {recordUpload: true});
        const {page} = result;
        await transfer(page, "drop", ["b.pdf", "c.txt"]);
        expect(await uploads(page)).toEqual([["b.pdf", "c.txt"]]);
        await page.close();
    });

    it("drop：imageOnly 為 false 時只依 accept 過濾", async () => {
        const result = await mountEditor({value: "", upload: {imageOnly: false, accept: "image/*,.pdf"}}, {recordUpload: true});
        const {page} = result;
        await transfer(page, "drop", ["b.pdf", "c.txt"]);
        expect(await uploads(page)).toEqual([["b.pdf"]]);
        await page.close();
    });
});
