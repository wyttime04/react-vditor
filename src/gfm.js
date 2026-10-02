// 只支援 GFM 的預設設定。vditor 原本的附加渲染（mermaid、數學式、echarts…）一律不渲染，
// 顯示成普通程式碼區塊；webpack plugin 也不會輸出那些渲染套件。
import {UPLOAD_IMAGE, uploadImageItem} from "./uploadImage.js";

/** Lute 會把這些語言輸出成 <div class="language-xxx"> 等渲染器畫圖 */
const DIV_LANGUAGES = "mermaid|echarts|abc|graphviz|mindmap|flowchart|plantuml|infographic|math";
/** 這些語言輸出成 <pre><code class="language-xxx">，但渲染器一樣會找上門 */
const CODE_LANGUAGES = "smiles|wavedrom|markmap|math";

const DIV_PATTERN = new RegExp(`<div(?: data-code="[^"]*")? class="language-(${DIV_LANGUAGES})">([\\s\\S]*?)</div>`, "g");
const CODE_PATTERN = new RegExp(`<code class="language-(${CODE_LANGUAGES})">`, "g");
const INLINE_MATH_PATTERN = /<span class="language-math">([\s\S]*?)<\/span>/g;

/**
 * 預覽用的 HTML 轉換：非 GFM 的區塊一律變成普通程式碼區塊。
 * class 改成 language-plaintext，渲染器就找不到它們，也就不會去載入沒輸出的套件；原本的語言留在 data-lang。
 */
export const gfmTransform = (html) => html
    .replace(DIV_PATTERN, '<pre><code class="language-plaintext" data-lang="$1">$2</code></pre>')
    .replace(CODE_PATTERN, '<code class="language-plaintext" data-lang="$1">')
    .replace(INLINE_MATH_PATTERN, "$$$1$$");

/**
 * 預設工具列。跟 vditor 原本的相比：
 * - 拿掉 export（寫死連 CDN）、devtools（要 echarts）、info（寫死 unpkg 的 logo）
 * - 拿掉 emoji、record、upload、code-theme、content-theme、help
 * - 加上只收圖片的 upload-image
 */
const TOOLBAR = [
    "headings", "bold", "italic", "strike", "link", "|",
    "list", "ordered-list", "check", "outdent", "indent", "|",
    "quote", "line", "code", "inline-code", "insert-before", "insert-after", "|",
    UPLOAD_IMAGE, "table", "|",
    "undo", "redo", "|",
    "fullscreen", "edit-mode",
    {name: "more", toolbar: ["both", "outline", "preview"]},
];

/** 工具列裡的 upload-image（含 more 之類的子選單）換成完整的按鈕設定 */
const expandToolbar = (toolbar, lang) => toolbar.map((item) => {
    if (item === UPLOAD_IMAGE || item?.name === UPLOAD_IMAGE) {
        return uploadImageItem(item, lang);
    }
    return item?.toolbar ? {...item, toolbar: expandToolbar(item.toolbar, lang)} : item;
});

const isPlainObject = (value) => Object.prototype.toString.call(value) === "[object Object]";

/** 物件逐層合併，陣列與其他值直接覆蓋 */
const merge = (base, override) => {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return override === undefined ? base : override;
    }
    const result = {...base};
    Object.keys(override).forEach((key) => {
        result[key] = merge(result[key], override[key]);
    });
    return result;
};

/** 使用端自己的 transform 接在 gfmTransform 之後 */
const withGfmTransform = (transform) =>
    transform ? (html) => transform(gfmTransform(html)) : gfmTransform;

/** 編輯器選項：GFM 預設值，再疊上使用端的選項 */
export const gfmEditorOptions = (options, cdn) => {
    const merged = merge({
        cdn,
        lang: "zh_TW",
        mode: "wysiwyg",
        // 傳 HTMLElement 給 vditor 時，開快取一定要有 cache.id，否則直接拋錯
        cache: {enable: false},
        toolbar: TOOLBAR,
        preview: {
            actions: [],
            markdown: {
                footnotes: false,          // GFM 以外、預設開著的只有註腳
                codeBlockPreview: false,   // ir / wysiwyg 的程式碼區塊不開預覽面板，否則會去渲染 mermaid 等區塊
                mathBlockPreview: false,   // 同上，$$ 區塊
            },
            render: {media: {enable: false}},   // 不把影片、音訊連結嵌成 iframe
        },
    }, options);
    merged.preview = {
        ...merged.preview,
        transform: withGfmTransform(options.preview?.transform),
        // 內容主題不交給 vditor（它用整頁共用的 <link>），改由元件容器的 class 套用 index.css 裡局部化的主題
        theme: {...merged.preview.theme, current: ""},
    };
    merged.toolbar = expandToolbar(merged.toolbar, merged.lang);
    return merged;
};

/** Vditor.preview 的選項：GFM 預設值，再疊上使用端的選項 */
export const gfmPreviewOptions = (options, cdn) => {
    const merged = merge({
        cdn,
        lang: "zh_TW",
        mode: "light",
        markdown: {footnotes: false},
        render: {media: {enable: false}},
    }, options);
    merged.transform = withGfmTransform(options.transform);
    // 同編輯器：內容主題改由元件容器的 class 決定
    merged.theme = {...merged.theme, current: ""};
    return merged;
};
