// 測試頁：用使用端的方式（webpack + VditorAssetsPlugin）建置，React 是 devDependencies 裡的 16.9
const path = require("path");
const VditorAssetsPlugin = require("../../webpack-plugin/index.cjs");

const root = path.resolve(__dirname, "../..");

module.exports = {
    mode: "development",
    devtool: false,
    entry: path.join(__dirname, "src/main.jsx"),
    output: {
        path: path.join(__dirname, "dist"),
        filename: "main.js",
        clean: true,
    },
    resolve: {
        extensions: [".jsx", ".js"],
        // src 裡的 import 寫 ./xxx.js（babel 編譯後的檔名），測試直接吃原始碼時也要能對應到 .jsx
        extensionAlias: {".js": [".js", ".jsx"]},
    },
    module: {
        rules: [{
            test: /\.jsx?$/,
            include: [path.join(root, "src"), path.join(__dirname, "src")],
            loader: "babel-loader",   // 用根目錄的 babel.config.cjs
        }],
    },
    plugins: [new VditorAssetsPlugin()],
    performance: {hints: false},
};
