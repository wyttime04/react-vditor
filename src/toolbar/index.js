import {UPLOAD_IMAGE, uploadImageItem} from "./uploadImage.js";

/**
 * 預設工具列。跟 vditor 原本的相比：
 * - 拿掉 export（寫死連 CDN）、devtools（要 echarts）、info（寫死 unpkg 的 logo）
 * - 拿掉 emoji、record、upload、code-theme、content-theme、help
 * - 加上只收圖片的 upload-image
 */
export const TOOLBAR = [
    "headings", "bold", "italic", "strike", "link", "|",
    "list", "ordered-list", "check", "outdent", "indent", "|",
    "quote", "line", "code", "inline-code", "insert-before", "insert-after", "|",
    UPLOAD_IMAGE, "table", "|",
    "undo", "redo", "|",
    "fullscreen", "edit-mode",
    {name: "more", toolbar: ["both", "outline", "preview"]},
];

/** 工具列裡的 upload-image（含 more 之類的子選單）換成完整的按鈕設定 */
export const expandToolbar = (toolbar, lang) => toolbar.map((item) => {
    if (item === UPLOAD_IMAGE || item?.name === UPLOAD_IMAGE) {
        return uploadImageItem(item, lang);
    }
    return item?.toolbar ? {...item, toolbar: expandToolbar(item.toolbar, lang)} : item;
});
