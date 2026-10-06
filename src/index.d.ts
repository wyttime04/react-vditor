// react-vditor 的型別。IOptions、IPreviewOptions 是 vditor 提供的全域型別，import vditor 時一併載入
import * as React from "react";
import type VditorCore from "vditor";

/** 主題。auto 跟著作業系統的深色模式 */
export type VditorTheme = "light" | "dark" | "auto";

/** 讓底下所有 <Vditor>、<VditorPreview> 預設用同一個主題；值變動時它們會跟著切換。元件自己的 theme prop 優先 */
export declare const VditorThemeProvider: (props: {theme: VditorTheme, children?: React.ReactNode}) => React.ReactElement;

/** ref 上可以呼叫的方法，名稱與原生 vditor 相同（destroy 由元件管理、setTheme 改用 theme prop，都不開放） */
export type VditorRef = Pick<VditorCore,
    | "updateToolbarConfig" | "focus" | "blur" | "disabled" | "enable" | "renderPreview"
    | "clearCache" | "disabledCache" | "enableCache" | "tip" | "setPreviewMode" | "deleteValue" | "updateValue"
    | "insertValue" | "insertMD" | "setValue" | "insertEmptyBlock" | "clearStack"
    | "hlCommentIds" | "unHlCommentIds" | "removeCommentIds"
    | "getValue" | "getCurrentMode" | "getSelection" | "getCursorPosition" | "isUploading"
    | "html2md" | "exportJSON" | "getHTML" | "getCommentIds">;

/** props 就是 vditor 的 IOptions（theme 換成 VditorTheme），另外加 className、style */
export type VditorProps = Omit<IOptions, "theme"> & {
    /** 預設取最近的 VditorThemeProvider，沒有就是 light */
    theme?: VditorTheme;
    className?: string;
    style?: React.CSSProperties;
};

/** vditor 編輯器。value 是初始值；之後使用端改 value 會套用，打字觸發的 input 回傳值不會被蓋回去 */
export declare const Vditor: React.ForwardRefExoticComponent<VditorProps & React.RefAttributes<VditorRef>>;

/** props 是 Vditor.preview 的 IPreviewOptions（theme 換成 VditorTheme；mode 只給 GFM 以外的渲染器用，拿掉），加上 value、className、style */
export type VditorPreviewProps = Omit<Partial<IPreviewOptions>, "theme" | "mode"> & {
    /** 要渲染的 Markdown */
    value: string;
    /** 預設取最近的 VditorThemeProvider，沒有就是 light */
    theme?: VditorTheme;
    className?: string;
    style?: React.CSSProperties;
};

/** 只渲染 Markdown、不建立編輯器 */
export declare const VditorPreview: (props: VditorPreviewProps) => React.ReactElement;

/** 非 GFM 的區塊（mermaid、數學式等）一律變成普通程式碼區塊 */
export declare const gfmTransform: (html: string) => string;

/** 網址不合法的連結變成純文字，只留下連結文字 */
export declare const linkTransform: (html: string) => string;

/** 預覽輸出使用的轉換：依序套用 gfmTransform、linkTransform */
export declare const previewTransform: (html: string) => string;

/** Markdown 轉 HTML，跟預覽一樣套用 previewTransform */
export declare const md2html: (markdown: string, options?: Partial<IPreviewOptions>) => Promise<string>;
