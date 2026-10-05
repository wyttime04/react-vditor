# Changelog

## [0.1.0](https://github.com/wyttime04/react-vditor/releases/tag/v0.1.0) (2026-10-05)

首個版本，以 [vditor](https://github.com/Vanessa219/vditor) 4.0.0 為基礎，僅支援 GFM 並可於完全離線的環境運作。

### feat

* 新增 `<Vditor>` 編輯器元件，props 沿用 vditor 的 `IOptions` ([7d331c6](https://github.com/wyttime04/react-vditor/commit/7d331c6))
  * 支援受控用法：`input` 回傳的值傳回 `value` 時不會重新渲染，打字不會被打斷
  * `mode`, `lang`, `toolbar`, `icon`, `cdn`, `height` 變更時重建編輯器並保留內容；callback 一律呼叫最新傳入的函式
  * ref 提供 vditor 實例的方法，名稱與原生相同；編輯器就緒前的呼叫會暫存，就緒後依序執行
* 新增 `<VditorPreview>` 預覽元件與 `md2html()` ([7d331c6](https://github.com/wyttime04/react-vditor/commit/7d331c6))
* 僅支援 GFM：mermaid、數學式、echarts 等附加渲染一律停用，相關區塊以一般程式碼區塊呈現 ([7d331c6](https://github.com/wyttime04/react-vditor/commit/7d331c6))
* 新增 `light` / `dark` / `auto` 主題與 `VditorThemeProvider`；主題樣式局部化，同一頁面可混用不同主題 ([7d331c6](https://github.com/wyttime04/react-vditor/commit/7d331c6))
* 新增僅接受圖片的上傳按鈕 `upload-image`，並調整預設工具列 ([7d331c6](https://github.com/wyttime04/react-vditor/commit/7d331c6))
* 新增 webpack plugin `VditorAssetsPlugin`，輸出執行期所需的資源，不連線至任何 CDN ([7d331c6](https://github.com/wyttime04/react-vditor/commit/7d331c6))
* 新增 TypeScript 型別定義 ([7d331c6](https://github.com/wyttime04/react-vditor/commit/7d331c6))

### ci

* 新增 GitHub Pages 部署開發用畫面 ([7c5e1cc](https://github.com/wyttime04/react-vditor/commit/7c5e1cc))
* 新增以 npm trusted publishing 自動發佈套件 ([605432f](https://github.com/wyttime04/react-vditor/commit/605432f))
