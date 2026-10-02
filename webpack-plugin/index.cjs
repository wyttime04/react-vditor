// 把 vditor 執行期要載入的資源輸出到 webpack output 的 vditor/dist/ 底下。
// 只輸出 GFM 用得到的部分；附加渲染套件（mermaid、katex、mathjax、echarts…）一律不輸出。
// 內容主題與 dark 的程式碼主題已經局部化、併進 react-vditor/index.css，這裡也不輸出。
const fs = require("fs");
const path = require("path");

const PLUGIN_NAME = "VditorAssetsPlugin";
const DIST = path.dirname(require.resolve("vditor/dist/index.css"));
const INCLUDE = [
    "js/lute",                              // Markdown 解析引擎
    "js/i18n",                              // 介面語系
    "js/icons",                             // 工具列圖示
    "js/highlight.js/highlight.min.js",     // 程式碼上色
    "js/highlight.js/third-languages.js",   // vditor 自己加的語言
    "js/highlight.js/styles/github.min.css", // vditor 一定會整頁載入這一個，不論設定
    "images",                               // 圖片 emoji、載入中圖示
];

const listFiles = (target) => (fs.statSync(target).isDirectory()
    ? fs.readdirSync(target).flatMap((name) => listFiles(path.join(target, name)))
    : [target]);

class VditorAssetsPlugin {
    apply(compiler) {
        const {RawSource} = compiler.webpack.sources;
        let files;
        compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.hooks.processAssets.tap({
                name: PLUGIN_NAME,
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
            }, () => {
                // watch 模式下每次編譯都會進來，檔案內容不會變，讀一次就好
                files = files || INCLUDE.flatMap((dir) => listFiles(path.join(DIST, dir))).map((file) => ({
                    name: `vditor/dist/${path.relative(DIST, file).split(path.sep).join("/")}`,
                    source: new RawSource(fs.readFileSync(file)),
                }));
                // minimized：vditor 的檔案本來就壓縮過，不要讓 production build 的 terser 再處理一次
                files.forEach(({name, source}) => compilation.emitAsset(name, source, {minimized: true}));
            });
        });
    }
}

module.exports = VditorAssetsPlugin;
