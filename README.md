# @wyttime04/react-vditor

以 [vditor](https://github.com/Vanessa219/vditor) 4.0.0 為基礎的 React 元件，**僅支援 GFM 語法，並可於完全離線的環境運作**。

- mermaid、數學式、echarts 等 GFM 以外的附加渲染一律停用，相關區塊以一般程式碼區塊呈現
- 執行期僅載入同源資源，不連線至任何 CDN

**Online Demo**：[wyttime04.github.io/react-vditor](https://wyttime04.github.io/react-vditor/)

**NPM Package**：[@wyttime04/react-vditor](https://www.npmjs.com/package/@wyttime04/react-vditor)

## 相容性

| 項目 | 版本 |
|---|---|
| React | 16.9 ～ 19（`peerDependencies`；自動測試以 16.9 進行） |
| webpack | ^5.76.0（使用 `VditorAssetsPlugin` 時） |

## 安裝

```sh
npm install @wyttime04/react-vditor
```

### 設定 webpack

加入 `VditorAssetsPlugin`。它會將 vditor 執行期所需的資源（lute、語系、圖示、highlight.js、emoji 圖片，約 4.8 MB）
輸出至 webpack output 目錄下的 `vditor/`。

```js
// webpack.config.js
const VditorAssetsPlugin = require("@wyttime04/react-vditor/webpack-plugin");

module.exports = {
    // ...
    module: {rules: [{test: /\.css$/, use: ["style-loader", "css-loader"]}]},
    plugins: [new VditorAssetsPlugin()],
};
```

元件會依 webpack 的 `publicPath` 自動定位這些資源，無須額外設定。若資源部署於其他位置，
請透過 `cdn` prop 指定 `vditor/` 目錄的網址；vditor 會自 `${cdn}/dist/...` 載入資源。

### 載入樣式

```js
import "@wyttime04/react-vditor/index.css";
```

`index.css` 包含 vditor 的樣式，以及本套件局部化後的 `light` / `dark` 主題樣式。

## 使用方式

```jsx
import {Vditor, VditorPreview, md2html} from "@wyttime04/react-vditor";
import "@wyttime04/react-vditor/index.css";

// 編輯器
const ref = useRef(null);
<Vditor ref={ref} value={markdown} input={setMarkdown}/>

// 僅渲染內容，不建立編輯器
<VditorPreview value={markdown}/>

// 轉換為 HTML
const html = await md2html(markdown);
```

## API

### `<Vditor>`

props 沿用 vditor 的 `IOptions`（[官方文件](https://github.com/Vanessa219/vditor#options)），另增 `className`, `style`；
其中 `theme` 為本套件定義的 `"light" | "dark" | "auto"`，詳見「[主題](#主題)」。
callback 沿用 vditor 原生名稱，例如 `input`, `after`, `focus`, `blur`。

#### props 變更時的行為

vditor 本身是非受控元件，大部分設定只在建立編輯器時讀取一次。元件依下表處理 props 的變更：

| props | 變更時的行為 | 使用時注意 |
|---|---|---|
| `mode`, `lang`, `toolbar`, `icon`, `cdn`, `height` | 重新建立編輯器，內容保留 | 復原紀錄、游標位置與 `disabled` 狀態不會保留，不適合在編輯途中頻繁變更。<br>`toolbar` 以內容比較，每次 render 傳入新的陣列不會觸發重建；但只變更按鈕的 `click` 函式不會生效 |
| `value` | 與編輯器目前的內容不同時，以新內容重新渲染編輯區 | 可作為受控元件使用：`input` 回傳的值再傳回 `value` 時不會重新渲染，打字不會被打斷。<br>由外部改寫 `value` 會重新渲染整個編輯區，游標位置不保留 |
| `theme` | 同時切換編輯器外框、內容主題與程式碼上色 | 不會重新建立編輯器 |
| `className`, `style` | 立即套用於元件的外層容器 | |
| callback：`after`, `input`, `focus`, `blur`, `keydown`, `esc`, `ctrlEnter`, `select`, `unSelect`, `customWysiwygToolbar`, `customWysiwygMobileToolbar` | 一律呼叫最新傳入的函式 | 可直接傳入 inline 函式，不需以 `useCallback` 固定，也不會觸發重建 |
| 其他（例如 `placeholder`, `upload`, `preview`, `counter`, `hint`） | 不套用 | 開發模式下會於主控台警告一次；如需套用，請變更元件的 `key` 以重新建立。<br>**物件中的函式同樣只在建立時讀取**，例如 `upload.handler`：若其中引用了會變動的 state，請改以 ref 取得最新值，避免讀到建立當下的舊值 |

#### ref

透過 ref 取得的物件，提供 vditor 實例的方法，用於在元件外操作編輯器，例如插入文字、取得內容或停用編輯器。
方法名稱與參數皆與 vditor 原生相同，詳細說明請參考 [vditor 文件的 methods](https://github.com/Vanessa219/vditor#methods)。

```jsx
const editorRef = useRef(null);

<Vditor ref={editorRef}/>
<button onClick={() => editorRef.current.insertValue("**粗體**")}>插入粗體</button>
<button onClick={() => console.log(editorRef.current.getValue())}>取得內容</button>
```

**可用的方法**

| 分類 | 方法 | 說明 |
|---|---|---|
| 內容 | `getValue()` | 取得 Markdown |
| | `setValue(markdown, clearStack?)` | 取代全部內容；`clearStack` 為 `true` 時一併清除復原紀錄 |
| | `insertValue(value, render?)` | 於游標處插入內容，預設會渲染 Markdown |
| | `insertMD(md)` | 於游標處插入 Markdown |
| | `updateValue(value)` | 取代目前選取的內容 |
| | `deleteValue()` | 刪除目前選取的內容 |
| | `getHTML()` | 取得渲染後的 HTML |
| | `html2md(html)` | 將 HTML 轉換為 Markdown |
| | `exportJSON(markdown)` | 將 Markdown 轉換為 JSON（語法樹） |
| 編輯狀態 | `focus()`, `blur()` | 取得／移除焦點 |
| | `disabled()`, `enable()` | 停用／啟用編輯器 |
| | `getCurrentMode()` | 取得目前的編輯模式（`wysiwyg` / `ir` / `sv`） |
| | `clearStack()` | 清除復原紀錄 |
| | `isUploading()` | 是否仍有上傳進行中 |
| 游標與選取 | `getSelection()` | 取得選取的文字 |
| | `getCursorPosition()` | 取得游標在畫面上的位置 |
| | `insertEmptyBlock(position)` | 於目前區塊前或後插入空白區塊 |
| 預覽 | `renderPreview(value?)` | 重新渲染預覽區 |
| | `setPreviewMode(mode)` | 設定 sv 模式的預覽方式（`both` / `editor`） |
| 介面 | `tip(text, time?)` | 顯示提示訊息；`time` 為 `0` 時持續顯示 |
| | `updateToolbarConfig(options)` | 更新工具列設定（例如隱藏或固定工具列） |
| 快取 | `clearCache()`, `disabledCache()`, `enableCache()` | 清除／停用／啟用本機快取 |
| 評論 | `getCommentIds()`, `hlCommentIds(ids)`, `unHlCommentIds(ids)`, `removeCommentIds(ids)` | 取得、標示、取消標示、移除評論（僅 wysiwyg 模式且啟用 `comment` 時有效） |

**不提供的方法**

| 方法 | 原因 | 替代方式 |
|---|---|---|
| `destroy()` | 由元件於卸載時自動呼叫 | 卸載元件 |
| `setTheme()` | 原生的 `setTheme` 會插入整頁共用的主題樣式，導致各元件的主題互相影響 | `theme` prop 或 `VditorThemeProvider`，詳見「[主題](#主題)」 |

**在編輯器就緒前使用 ref**

vditor 的初始化是非同步的：元件掛載後，須先載入語系與 Markdown 解析引擎，完成後才會觸發 `after` callback，
在此之前 vditor 實例尚無法操作。為了讓使用端不必等待 `after`，例如在 `useEffect` 中即可呼叫 ref，
元件會先代為處理這段期間的呼叫：

| 呼叫的方法 | 就緒前的處理方式 |
|---|---|
| 不回傳值的方法（`setValue`, `insertValue`, `focus`, `disabled` 等） | 暫存，於就緒後依呼叫順序執行 |
| `getValue()` | 回傳 `value` prop 的內容 |
| `getCurrentMode()` | 回傳 `mode` prop，未指定時為 `wysiwyg` |
| 其他查詢方法（`getHTML()`, `getSelection()` 等） | 回傳 `undefined`；需要結果時，請於 `after` callback 觸發後再呼叫 |

```jsx
useEffect(() => {
    // 此時編輯器可能尚未就緒；呼叫會先暫存，就緒後自動執行
    editorRef.current.setValue(draft);
    editorRef.current.focus();
}, []);
```

### `<VditorPreview>`

props 沿用 `Vditor.preview` 的 `IPreviewOptions`，另增 `value`（要渲染的 Markdown）、`className`, `style`。
`theme` 與 `<Vditor>` 相同，詳見「[主題](#主題)」；`mode` 僅供 GFM 以外的渲染器使用，因此不提供。

### `md2html(markdown, options?)`

將 Markdown 轉換為 HTML，回傳 `Promise<string>`。GFM 以外的區塊會與預覽相同，轉換為一般程式碼區塊
（vditor 原生的 `md2html` 不套用 `transform`，因此由本函式處理）。

## 主題

`<Vditor>` 與 `<VditorPreview>` 提供 `light`, `dark` 兩種主題，另可設為 `auto`，依作業系統的外觀設定（`prefers-color-scheme`）自動切換，並在系統設定變更時即時套用。

### 指定單一元件的主題

透過元件的 `theme` prop 指定：

```jsx
<Vditor value={markdown} theme="dark"/>
<VditorPreview value={markdown} theme="light"/>
```

### 同步多個元件的主題

若需要讓頁面或整個系統內的所有編輯器與預覽使用一致的主題，請使用 `VditorThemeProvider`。
置於元件樹的上層後，其下所有未指定 `theme` 的 `<Vditor>` 與 `<VditorPreview>` 都會套用它的值；
值變更時，這些元件會同步切換。

```jsx
import {VditorThemeProvider} from "@wyttime04/react-vditor";

const App = () => {
    // 主題值由應用程式自行管理；是否保存（例如 localStorage、使用者設定）由應用程式決定
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "auto");
    useEffect(() => localStorage.setItem("theme", theme), [theme]);

    return <VditorThemeProvider theme={theme}>
        <Routes/>
    </VditorThemeProvider>;
};
```

- 套用於整個系統：將 `VditorThemeProvider` 置於應用程式的根元件
- 套用於單一頁面：將 `VditorThemeProvider` 置於該頁面的最上層元件

### 套用順序

1. 元件本身的 `theme` prop
2. 最接近的上層 `VditorThemeProvider`
3. 預設值 `light`

### 各主題的樣式

| 項目 | `light` | `dark` |
|---|---|---|
| 編輯器外框 | vditor `classic` | vditor `dark` |
| 內容主題 | vditor `light` | vditor `dark` |
| 程式碼上色 | highlight.js `github` | highlight.js `github-dark` |
| `<VditorPreview>` 背景色 | 不設定 | `#2f363d`（與 vditor 深色編輯區相同） |

### 說明

- 各元件的主題彼此獨立，同一頁面可混用不同主題。vditor 原生以整頁共用的 `<link>` 載入內容主題，
  同一頁面只能使用一種；本套件將主題樣式局部化並併入 `index.css`，改由元件容器上的
  `react-vditor--light` / `react-vditor--dark` class 套用。
- 切換主題不會重建編輯器。
- `theme` prop 取代 vditor 原生的 `theme`（`classic` / `dark`）與 `preview.theme` 設定；ref 亦不提供 `setTheme`。

## 工具列

### 預設工具列

```js
[
    "headings", "bold", "italic", "strike", "link", "|",
    "list", "ordered-list", "check", "outdent", "indent", "|",
    "quote", "line", "code", "inline-code", "insert-before", "insert-after", "|",
    "upload-image", "table", "|",
    "undo", "redo", "|",
    "fullscreen", "edit-mode",
    {name: "more", toolbar: ["both", "outline", "preview"]},
]
```

與 vditor 原生的預設工具列相比：

- 移除 `export`（寫死連線至 CDN）、`devtools`（依賴 echarts）、`info`（寫死 unpkg 的圖片網址）
- 移除 `emoji`, `record`, `upload`, `code-theme`, `content-theme`, `help`
- 新增 `upload-image`

傳入 `toolbar` prop 時，會完整取代預設工具列。

### 上傳圖片按鈕 `upload-image`

僅接受圖片的上傳按鈕，已包含在預設工具列中，並可與 vditor 內建的 `upload`（圖片或文件）同時使用。

#### 範例

```jsx
const editorRef = useRef(null);

<Vditor
    ref={editorRef}
    upload={{
        handler: async (files) => {
            for (const file of files) {
                const url = await uploadToServer(file);   // 由應用程式實作上傳
                editorRef.current.insertValue(`![${file.name}](${url})`);
            }
            return null;   // 回傳字串時，會以提示訊息顯示
        },
    }}
/>
```

使用自訂的 `toolbar` 時，請將 `"upload-image"` 加入其中：

```jsx
<Vditor toolbar={["bold", "italic", "|", "upload-image"]} upload={{handler}}/>
```

#### 行為

1. 點選按鈕後開啟檔案選擇視窗，僅列出圖片檔
2. 選取的檔案再次過濾，僅保留圖片，交由 `upload.handler` 處理
3. `handler` 回傳字串時，以提示訊息顯示（例如「檔案過大」）

此行為與 vditor 內建上傳在設定 `handler` 時相同。插入圖片語法由 `handler` 負責，例如呼叫 ref 的 `insertValue`。

#### 相關設定

| 設定 | 說明 |
|---|---|
| `upload.handler` | 必填。未設定時，點選按鈕僅顯示設定提示，不開啟檔案選擇視窗 |
| `upload.multiple` | 為 `true`（vditor 預設）時可一次選取多張圖片，否則僅能選取一張 |
| `lang` | 按鈕的提示文字依語言顯示，支援 zh_TW、zh_CN、en_US，其他語言顯示英文 |
| 以物件指定按鈕 | 如需自訂提示文字或圖示：`{name: "upload-image", tip: "…", icon: "<svg>…</svg>"}`，指定的欄位優先於預設值。自訂的 `tip` 為固定字串，不會隨語言切換 |

#### 限制

- 僅支援 `upload.handler`，不支援 `upload.url`：`url` 屬於 vditor 內部的上傳流程，未提供可呼叫的公開 API
- 檔案類型的限制僅作用於檔案選擇視窗；以拖放或貼上方式加入的檔案不經過此按鈕。
  另外，設定 `upload.handler` 時 vditor 不會檢查檔案類型與大小，請於 `handler` 中自行驗證
- `upload.handler` 只在建立編輯器時讀取，詳見「[props 變更時的行為](#props-變更時的行為)」

## 預設值與原生 vditor 的差異

| 設定 | 預設值 | 說明 |
|---|---|---|
| `mode` | `wysiwyg` | vditor 原生為 `ir` |
| `lang` | `zh_TW` | |
| `theme` | `light` | 僅支援 `light` / `dark` / `auto`，詳見「[主題](#主題)」 |
| `toolbar` | 詳見「[預設工具列](#預設工具列)」 | |
| `cache` | `{enable: false}` | vditor 啟用快取時必須提供 `cache.id` |
| `preview.markdown.footnotes` | `false` | GFM 不包含註腳 |
| `preview.markdown.codeBlockPreview`, `mathBlockPreview` | `false` | ir / wysiwyg 模式不顯示程式碼區塊的預覽面板，避免渲染 mermaid 等區塊 |
| `preview.render.media.enable` | `false` | 不將影片、音訊連結嵌入為 iframe |
| `preview.transform` | GFM 以外的區塊轉為一般程式碼區塊 | 使用端傳入的 `transform` 會於其後執行 |
| `preview.theme.current` | `""`（固定） | 內容主題改由 `theme` 決定，不使用 vditor 整頁共用的 `<link>` |
| 行內數學式 `$…$` | 視為一般文字 | GFM 不包含數學式 |

## 已知限制

- ir / wysiwyg 模式中的程式碼區塊不會上色（停用預覽面板所致）；sv 模式的預覽區與 `<VditorPreview>` 仍會上色
- `$$ … $$` 區塊會以程式碼區塊呈現（Lute 未提供停用此語法的設定）
- `:smile:` 等 emoji 代碼會轉為對應字元，YAML front matter 會以程式碼區塊呈現；兩者雖非 GFM 語法，仍予以保留
- vditor 無論設定為何，都會整頁載入 highlight.js 的 `github.min.css`；`dark` 主題的程式碼樣式以局部化且優先權較高的規則覆寫
- 啟用 `cache` 且未提供 `value` 時，若快取內容包含 `$…$`，初次渲染會嘗試載入未輸出的 katex，產生本機 404

## 開發

```sh
npm install
npm start            # 啟動開發用畫面 http://localhost:9000，直接載入 src 原始碼並自動重新整理
npm run preview      # 先 npm run build，再以 dist/ 的套件啟動開發用畫面（production 模式），內容與 GitHub Pages 相同
npm run build        # 以 babel 將 src 的 .js / .jsx 編譯至 dist/，並附上 index.d.ts 與 index.css（由 scripts/css.cjs 產生）
npm run build:page   # 先 npm run build，再以 dist/ 的套件將開發用畫面建置至 dev/dist/，供 GitHub Pages 部署
npm run test:types   # 以 tsc 檢查手寫的 src/index.d.ts（test/types/usage.jsx）
npm test             # 建置測試頁、檢查型別，並執行 puppeteer 測試（React 16.9）
```

### 開發用畫面

`dev/` 提供開發用畫面：左側為 `<Vditor>`，右側為 `<VditorPreview>` 與 `md2html()` 的輸出，下方列出事件紀錄。
上方可切換主題（透過 `VditorThemeProvider`），並呼叫 ref 的 `insertValue`, `disabled` / `enable`, `getValue`。
工具列的「上傳圖片」不會實際上傳，選取的圖片以 `blob:` 網址直接顯示。

`dev/main.jsx` 與使用端相同，以 `import "@wyttime04/react-vditor"` 及 `import "@wyttime04/react-vditor/index.css"` 引用套件，
由 `dev/webpack.config.cjs` 依 mode 決定來源：

| mode | 指令 | 套件來源 |
|---|---|---|
| development | `npm start` | `src/` 原始碼；`index.css` 由 `dev/index.css.cjs` 即時產生，不需先 build |
| production | `npm run preview`, `npm run build:page` | `npm run build` 產出的 `dist/`，經 `package.json` 的 `exports` 解析 |

推送至 `main` 分支時，`.github/workflows/deploy-pages.yaml` 會執行 `npm run build:page`，並將 `dev/dist/` 部署至 GitHub Pages。
首次使用前，須於 repo 的 Settings → Pages 將 Source 設為「GitHub Actions」。

### 型別

原始碼僅使用 `.js` / `.jsx`，型別定義於 `src/index.d.ts`。變更元件的 props 或 ref 方法時，請同步更新 `index.d.ts`，
並於 `test/types/usage.jsx` 補上對應用法；`npm run test:types` 會檢查兩者是否一致。

### 測試

測試會確認每個情境皆無外部請求、無 404、無頁面錯誤。若 puppeteer 未下載瀏覽器，會改用系統安裝的 Chrome。

### 發佈

套件由 `.github/workflows/publish-npm.yaml` 於 GitHub Release 發佈時，透過 npm trusted publishing（OIDC）發佈。

1. 執行 `npm version <patch|minor|major> --no-git-tag-version`，更新 `package.json` 與 `package-lock.json` 的版本號
2. 更新 `CHANGELOG.md`
3. 執行 `git commit -am "chore(release): <版本>"` 與 `git tag v<版本>`
4. 執行 `git push origin main v<版本>`
5. 以該 tag 建立 GitHub Release

workflow 會驗證 tag 與 `package.json` 的版本一致，並於測試與建置通過後發佈至 dist-tag `latest`。

> **預發佈版本**
>
> - 第 1 步改以 `npm version prerelease --preid alpha --no-git-tag-version` 遞增（例如 `0.1.0-alpha.1` → `0.1.0-alpha.2`），
>   或直接指定版本號，例如 `npm version 0.2.0-alpha.0 --no-git-tag-version`
> - 第 5 步建立 Release 時須勾選「Set as a pre-release」
> - dist-tag 取自版本號的識別字，例如 `1.0.0-beta.0` 發佈至 `beta`，不會變更 `latest`
> - 預發佈版本執行 `npm version patch` 會轉為對應的正式版本（例如 `0.1.0-alpha.2` → `0.1.0`）

首次使用前，須於 npmjs.com 套件設定的 Trusted Publisher 加入此 repo 與 workflow 檔名 `publish-npm.yaml`，並允許 `npm publish`。
