import VditorCore from "vditor";
import {previewOptions} from "./options/default.js";

export {Vditor} from "./Vditor.js";
export {VditorPreview} from "./VditorPreview.js";
export {VditorThemeProvider} from "./theme.js";
export {gfmTransform, linkTransform, previewTransform} from "./transforms/index.js";

/** Markdown 轉 HTML，跟預覽一樣套用 previewTransform（原生 md2html 不吃 transform） */
export const md2html = async (markdown, options = {}) => {
    const merged = previewOptions(options);
    return merged.transform(await VditorCore.md2html(markdown, merged));
};
