// 開發用畫面。照使用端的方式 import "@wyttime04/react-vditor"，依 mode 決定套件來源：
// - development（npm start，http://localhost:9000）：吃 src 的原始碼，改了會自動重新整理，不用先 build
// - production（npm run preview、npm run build:page）：吃 npm run build 產出的 dist，經 package.json 的 exports 解析
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const VditorAssetsPlugin = require("../webpack-plugin/index.cjs");

const root = path.resolve(__dirname, "..");

module.exports = (env, argv) => {
    const production = argv.mode === "production";
    return {
        mode: production ? "production" : "development",
        devtool: production ? false : "eval-source-map",
        entry: path.join(__dirname, "main.jsx"),
        output: {
            path: path.join(__dirname, "dist"),
            filename: "main.js",
            // 執行期才決定，GitHub Pages 的子路徑（/react-vditor/）底下 vditor 的資源也找得到
            publicPath: "auto",
            clean: true,
        },
        resolve: {
            extensions: [".jsx", ".js"],
            // src 裡的 import 寫 ./xxx.js（babel 編譯後的檔名），直接吃原始碼時也要能對應到 .jsx
            extensionAlias: {".js": [".js", ".jsx"]},
            // production 不設 alias：跟使用端一樣解析到 dist
            alias: production ? {} : {
                "@wyttime04/react-vditor$": path.join(root, "src/index.js"),
                "@wyttime04/react-vditor/index.css$": path.join(__dirname, "index.css.cjs"),
            },
        },
        module: {
            rules: [{
                test: /\.jsx?$/,
                include: [path.join(root, "src"), __dirname],
                loader: "babel-loader",   // 用根目錄的 babel.config.cjs
            }, {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            }, {
                test: /index\.css\.cjs$/,
                use: ["style-loader", "css-loader", "val-loader"],
                // .cjs 預設只當 CommonJS 解析，但 style-loader 輸出的是 ESM
                type: "javascript/auto",
                // package.json 的 sideEffects 只列 *.css；不標記的話，只 import 不取值會被 webpack 整個移除
                sideEffects: true,
            }],
        },
        plugins: [
            new VditorAssetsPlugin(),
            new HtmlWebpackPlugin({template: path.join(__dirname, "index.html")}),
        ],
        devServer: {port: 9000},
        performance: {hints: false},
    };
};
