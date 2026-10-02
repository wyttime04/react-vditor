// webpack plugin 的輸出：只有 GFM 用得到的 vditor 資源
const fs = require("fs");
const path = require("path");

const listFiles = (dir) => fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
});

describe("VditorAssetsPlugin", () => {
    const output = path.join(__dirname, "app/dist/vditor/dist");
    const relative = () => listFiles(output).map((file) => path.relative(output, file).split(path.sep).join("/"));

    it("輸出 lute、語系、圖示、highlight.js、圖片", () => {
        [
            "js/lute/lute.min.js",
            "js/i18n/zh_TW.js",
            "js/icons/ant.js",
            "js/highlight.js/highlight.min.js",
            "js/highlight.js/third-languages.js",
            "js/highlight.js/styles/github.min.css",
            "images/emoji/doge.png",
        ].forEach((file) => expect(fs.existsSync(path.join(output, file))).toBe(true));
    });

    it("不輸出附加渲染套件", () => {
        expect(fs.readdirSync(path.join(output, "js")).sort()).toEqual(["highlight.js", "i18n", "icons", "lute"]);
    });

    it("不輸出內容主題與其他程式碼主題（已局部化併進 index.css）", () => {
        const files = relative();
        expect(files.filter((file) => file.startsWith("css/"))).toEqual([]);
        expect(files.filter((file) => file.startsWith("js/highlight.js/styles/"))).toEqual(["js/highlight.js/styles/github.min.css"]);
    });

    it("總大小不到 6 MB", () => {
        const size = listFiles(output).reduce((sum, file) => sum + fs.statSync(file).size, 0);
        expect(size).toBeLessThan(6 * 1024 * 1024);
    });
});
