// 套件的預設選項：預設值合併 gfm.js 的 GFM 限定設定，再疊上使用端的選項
import {TOOLBAR, expandToolbar} from "../toolbar/index.js";
import {previewTransform} from "../transforms/index.js";
import {uploadableOnly} from "../upload.js";
import {merge} from "../utils/merge.js";
import {gfmEditorOptions, gfmPreviewOptions} from "./gfm.js";

/* global __webpack_public_path__ */
/**
 * vditor 在執行期會去 `${cdn}/dist/...` 載入 lute、語系、圖示等資源。
 * webpack plugin 把它們輸出在 output 目錄底下的 vditor/，所以預設 cdn 跟著 webpack 的 publicPath 走。
 */
const defaultCdn = () => {
    // 不是用 webpack 打包時，typeof 未宣告的識別字會得到 "undefined"，不會拋錯
    const base = typeof __webpack_public_path__ === "string" ? __webpack_public_path__ : "/";
    return base === "" || base.endsWith("/") ? `${base}vditor` : `${base}/vditor`;
};

/** 使用端自己的 transform 接在 previewTransform 之後 */
const withPreviewTransform = (transform) =>
    transform ? (html) => transform(previewTransform(html)) : previewTransform;

/** 編輯器選項 */
export const editorOptions = (options) => {
    const defaults = merge({
        cdn: defaultCdn(),
        lang: "zh_TW",
        mode: "wysiwyg",
        // 傳 HTMLElement 給 vditor 時，開快取一定要有 cache.id，否則直接拋錯
        cache: {enable: false},
        toolbar: TOOLBAR,
        preview: {actions: []},
        // 本套件的選項：upload 按鈕、拖曳、貼上預設只收圖片
        upload: {imageOnly: true},
    }, gfmEditorOptions());
    const merged = merge(defaults, options);
    const {upload} = merged;
    merged.upload = {
        ...upload,
        // upload 按鈕的檔案選擇框用 accept 決定列出哪些檔案；imageOnly 而沒指定 accept 時只列出圖片
        accept: upload.imageOnly && !upload.accept ? "image/*" : upload.accept,
        ...(upload.handler && {handler: uploadableOnly(upload.handler, upload)}),
    };
    merged.preview = {
        ...merged.preview,
        transform: withPreviewTransform(options.preview?.transform),
        // 內容主題不交給 vditor（它用整頁共用的 <link>），改由元件容器的 class 套用 index.css 裡局部化的主題
        theme: {...merged.preview.theme, current: ""},
    };
    merged.toolbar = expandToolbar(merged.toolbar, merged.lang, upload.imageOnly);
    return merged;
};

/** Vditor.preview 的選項 */
export const previewOptions = (options) => {
    const defaults = merge({
        cdn: defaultCdn(),
        lang: "zh_TW",
        mode: "light",
    }, gfmPreviewOptions());
    const merged = merge(defaults, options);
    merged.transform = withPreviewTransform(options.transform);
    // 同編輯器：內容主題改由元件容器的 class 決定
    merged.theme = {...merged.theme, current: ""};
    return merged;
};
