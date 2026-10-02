import VditorCore from "vditor";
import {defaultCdn} from "./cdn.js";
import {gfmPreviewOptions, gfmTransform} from "./gfm.js";

export {Vditor} from "./Vditor.js";
export {VditorPreview} from "./VditorPreview.js";
export {VditorThemeProvider} from "./theme.js";
export {gfmTransform};

/** Markdown 轉 HTML，非 GFM 的區塊跟預覽一樣轉成普通程式碼區塊（原生 md2html 不吃 transform） */
export const md2html = async (markdown, options = {}) => {
    const merged = gfmPreviewOptions(options, options.cdn || defaultCdn());
    return merged.transform(await VditorCore.md2html(markdown, merged));
};
