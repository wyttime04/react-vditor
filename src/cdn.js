// vditor 在執行期會去 `${cdn}/dist/...` 載入 lute、語系、圖示等資源。
// webpack plugin 把它們輸出在 output 目錄底下的 vditor/，所以預設 cdn 跟著 webpack 的 publicPath 走。

/* global __webpack_public_path__ */
export const defaultCdn = () => {
    // 不是用 webpack 打包時，typeof 未宣告的識別字會得到 "undefined"，不會拋錯
    const base = typeof __webpack_public_path__ === "string" ? __webpack_public_path__ : "/";
    return base === "" || base.endsWith("/") ? `${base}vditor` : `${base}/vditor`;
};
