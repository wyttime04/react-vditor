// 上傳檔案的過濾。設了 upload.handler 時，vditor 不檢查檔案類型就把所有檔案交給 handler
// （拖曳、貼上、工具列的 upload 按鈕都是），這裡依 upload.imageOnly 與 upload.accept 補上檢查。

/**
 * 檔案是否符合 accept，規則同 <input accept>：.png 比對副檔名、image/* 比對類型前綴、image/png 比對完整類型。
 * accept 為空時不限制
 */
const isAccepted = (file, accept) => !accept || accept.split(",").some((item) => {
    const type = item.trim().toLowerCase();
    if (type.startsWith(".")) {
        return file.name.toLowerCase().endsWith(type);
    }
    if (type.endsWith("/*")) {
        return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
});

/** imageOnly 時必須是圖片，accept 再從中限縮；否則只看 accept */
const isUploadable = (file, {imageOnly, accept}) =>
    (!imageOnly || isAccepted(file, "image/*")) && isAccepted(file, accept);

/**
 * 包裝 upload.handler：只把可上傳的檔案交給它。
 * 一個都不符合時回傳提示文字，vditor 會顯示出來；不帶檔名，因為 vditor 用 innerHTML 顯示提示
 */
export const uploadableOnly = (handler, upload) => (files) => {
    const uploadable = files.filter((file) => isUploadable(file, upload));
    return uploadable.length > 0 ? handler(uploadable) : window.VditorI18n.fileTypeError;
};
