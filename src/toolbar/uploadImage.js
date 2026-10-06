// 「上傳圖片」按鈕：toolbar 裡寫 "upload-image" 就會換成這顆按鈕。
// vditor 內建的 upload 只有一顆，檔案類型看的是共用的 upload.accept，所以另做一顆只收圖片的。

/** 按鈕的 tip。vditor 語系檔沒有這個字，照各語系「上傳圖片或文件」的譯法拿掉「或文件」；沒列到的語言用英文 */
const TIPS = {
    en_US: "Upload image",
    zh_CN: "上传图片",
    zh_TW: "上傳圖片",
};

export const UPLOAD_IMAGE = "upload-image";

/**
 * 選完圖片後交給 upload.handler，做法與 vditor 內建上傳在設了 handler 時相同：
 * upload.multiple 不是 true 時只能選一張；handler 回傳字串時當成錯誤訊息顯示。
 * 只支援 upload.handler，不支援 upload.url（那條路是 vditor 內部的 XHR 上傳流程，沒有公開的 API 可以呼叫）。
 */
const pickImages = (vditor) => {
    const {handler, multiple} = vditor.options.upload;
    if (!handler) {
        vditor.tip.show("please config: options.upload.handler");
        return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = multiple === true;
    input.addEventListener("change", async () => {
        // 檔案選擇框可以切成「所有檔案」，所以再過濾一次
        const images = [...input.files].filter((file) => file.type.startsWith("image/"));
        if (images.length === 0) {
            return;
        }
        const message = await handler(images);
        if (typeof message === "string") {
            vditor.tip.show(message);
        }
    });
    input.click();
};

/** "upload-image"（字串或物件）換成完整的按鈕設定；使用端在物件裡給的欄位優先 */
export const uploadImageItem = (item, lang) => ({
    name: UPLOAD_IMAGE,
    icon: '<svg><use xlink:href="#vditor-icon-upload"></use></svg>',
    tip: TIPS[lang] || TIPS.en_US,
    click: (event, vditor) => pickImages(vditor),
    ...(typeof item === "string" ? {} : item),
});
