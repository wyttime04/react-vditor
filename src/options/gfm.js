// GFM 限定的設定：關掉 vditor 預設會渲染、但不屬於 GFM 的語法。
// 每次回傳新物件，避免不同的編輯器、預覽共用同一份選項物件

/** 編輯器 */
export const gfmEditorOptions = () => ({
    preview: {
        markdown: {
            footnotes: false,          // GFM 以外、預設開著的只有註腳
            codeBlockPreview: false,   // ir / wysiwyg 的程式碼區塊不開預覽面板，否則會去渲染 mermaid 等區塊
            mathBlockPreview: false,   // 同上，$$ 區塊
        },
        render: {media: {enable: false}},   // 不把影片、音訊連結嵌成 iframe
    },
});

/** Vditor.preview */
export const gfmPreviewOptions = () => ({
    markdown: {footnotes: false},
    render: {media: {enable: false}},
});
