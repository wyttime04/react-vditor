// npm start 用：src 沒有 index.css，由 val-loader 在打包時執行 buildCss()，內容與 npm run build 產生的 dist/index.css 相同
const {buildCss} = require("../scripts/css.cjs");

// cacheable：改其他檔案重新編譯時沿用結果，不重新產生；改了 scripts/css.cjs 要重啟 npm start
module.exports = () => ({code: buildCss(), cacheable: true});
