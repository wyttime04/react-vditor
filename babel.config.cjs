// src 的 .js / .jsx 編譯成 dist 的 .js；測試頁的 babel-loader 也用這份設定
module.exports = {
    presets: [
        // modules: false：保留 ESM，交給使用端的 bundler
        ["@babel/preset-env", {modules: false, targets: "defaults"}],
        // classic：編成 React.createElement，React 16.9～16.13 沒有 react/jsx-runtime
        ["@babel/preset-react", {runtime: "classic"}],
    ],
};
