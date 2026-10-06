// 預覽輸出的 HTML 轉換：各個 transform 都從這裡引用
import {gfmTransform} from "./gfm.js";

export {gfmTransform};

/** 預覽輸出使用的轉換：非 GFM 的區塊變成普通程式碼區塊，再把網址不合法的連結變成純文字 */
export const previewTransform = (html) => gfmTransform(html);
