// 產生套件的 index.css：vditor 的樣式，加上只作用在容器裡的 light / dark 主題。
// vditor 原本用整頁共用的 <link> 載入內容主題與程式碼主題，同一頁只能有一種；
// 這裡把它們加上 .react-vditor--light / .react-vditor--dark 前綴，由元件在自己的容器加 class 決定用哪個。
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const prefixSelector = require("postcss-prefix-selector");

const DIST = path.dirname(require.resolve("vditor/dist/index.css"));

const scoped = (file, prefix) => {
    const source = fs.readFileSync(path.join(DIST, file), "utf8");
    return postcss([prefixSelector({prefix})]).process(source, {from: undefined}).css;
};

const buildCss = () => [
    fs.readFileSync(path.join(DIST, "index.css"), "utf8"),
    "/* react-vditor light / dark 主題，只作用在 .react-vditor--light / .react-vditor--dark 容器裡 */",
    scoped("css/content-theme/light.css", ".react-vditor--light"),
    scoped("js/highlight.js/styles/github.min.css", ".react-vditor--light"),
    scoped("css/content-theme/dark.css", ".react-vditor--dark"),
    // vditor 一定會整頁載入 github.min.css；這裡的規則多了前綴，優先權比較高，會蓋過它
    scoped("js/highlight.js/styles/github-dark.min.css", ".react-vditor--dark"),
    // 深色內容主題只改文字顏色；<VditorPreview> 用編輯器深色編輯區的背景色
    ".react-vditor-preview.react-vditor--dark { background-color: #2f363d; }",
].join("\n");

module.exports = {buildCss};
