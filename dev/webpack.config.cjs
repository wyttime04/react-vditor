// 開發用畫面：npm start 後開 http://localhost:9000。直接吃 src 的原始碼，改了會自動重新整理
const path = require("path");
const VditorAssetsPlugin = require("../webpack-plugin/index.cjs");
const {buildCss} = require("../scripts/css.cjs");

const root = path.resolve(__dirname, "..");

module.exports = {
    mode: "development",
    devtool: "eval-source-map",
    entry: path.join(__dirname, "main.jsx"),
    output: {
        path: path.join(__dirname, "dist"),
        filename: "main.js",
        publicPath: "/",
    },
    resolve: {
        extensions: [".jsx", ".js"],
        // src 裡的 import 寫 ./xxx.js（babel 編譯後的檔名），直接吃原始碼時也要能對應到 .jsx
        extensionAlias: {".js": [".js", ".jsx"]},
    },
    module: {
        rules: [{
            test: /\.jsx?$/,
            include: [path.join(root, "src"), __dirname],
            loader: "babel-loader",   // 用根目錄的 babel.config.cjs
        }],
    },
    plugins: [new VditorAssetsPlugin()],
    devServer: {
        port: 9000,
        static: {directory: __dirname, watch: false},   // index.html
        // 樣式跟 npm run build 產生的 dist/index.css 相同（使用端是 import "@wyttime04/react-vditor/index.css"）
        setupMiddlewares: (middlewares) => [{
            name: "react-vditor-css",
            path: "/react-vditor.css",
            middleware: (request, response) => {
                response.setHeader("content-type", "text/css");
                response.end(buildCss());
            },
        }, ...middlewares],
    },
    performance: {hints: false},
};
