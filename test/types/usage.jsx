// @ts-check
// 型別檢查（npm run test:types）：確認 index.d.ts 能正確描述使用方式。
// 標了 @ts-expect-error 的那幾行必須報錯，型別太寬鬆時 tsc 會因為「預期的錯誤沒發生」而失敗。
import * as React from "react";
import {md2html, gfmTransform, Vditor, VditorPreview, VditorThemeProvider} from "../../src/index.js";

/** @type {React.RefObject<import("../../src/index.js").VditorRef>} */
const ref = React.createRef();

export const Editor = () => <Vditor
    ref={ref}
    mode="ir"
    theme="dark"
    value="# hi"
    input={(value) => value.trim()}
    after={() => ref.current?.setValue("x")}
    preview={{transform: (html) => html}}
    className="editor"
    style={{height: 300}}
/>;

export const Preview = () => <VditorPreview value="# hi" theme="auto" className="preview"/>;

export const Page = () => <VditorThemeProvider theme="dark">
    <Editor/>
    <Preview/>
</VditorThemeProvider>;

/** @type {Promise<string>} */
export const html = md2html("# hi");
/** @type {string} */
export const transformed = gfmTransform("<p>x</p>");

// @ts-expect-error mode 只能是 ir / wysiwyg / sv
export const WrongMode = () => <Vditor mode="markdown"/>;

// @ts-expect-error VditorPreview 一定要給 value
export const MissingValue = () => <VditorPreview/>;

// @ts-expect-error destroy 由元件管理，ref 上沒有
ref.current?.destroy();

// @ts-expect-error 主題改用 theme prop，ref 上沒有 setTheme
ref.current?.setTheme("dark");

// @ts-expect-error theme 只有 light / dark / auto，vditor 原本的 classic 不行
export const WrongTheme = () => <Vditor theme="classic"/>;

// @ts-expect-error VditorPreview 沒有 mode（只給 GFM 以外的渲染器用）
export const PreviewMode = () => <VditorPreview value="" mode="dark"/>;
