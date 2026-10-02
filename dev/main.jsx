// 開發用畫面：左邊編輯器、右邊預覽與 md2html 的輸出，上方可以切換主題、呼叫 ref 的方法（模式用編輯器工具列切換）
import * as React from "react";
import * as ReactDOM from "react-dom";
import {md2html, Vditor, VditorPreview, VditorThemeProvider} from "../src/index.js";

const SAMPLE = [
    "# GFM 範例",
    "",
    "**粗體**、*斜體*、~~刪除線~~、`行內程式碼`、自動連結 www.example.com",
    "",
    "- [x] 已完成的任務",
    "- [ ] 未完成的任務",
    "",
    "| 欄位 | 說明 |",
    "| --- | --- |",
    "| a | 表格 |",
    "",
    "```js",
    "const answer = 42;",
    "```",
    "",
    "## 以下不是 GFM，應該顯示成文字或普通程式碼區塊",
    "",
    "行內數學式 $x^2$",
    "",
    "```mermaid",
    "graph TD",
    "A-->B",
    "```",
    "",
    "$$",
    "E=mc^2",
    "$$",
].join("\n");

const App = () => {
    const editorRef = React.useRef(null);
    const [value, setValue] = React.useState(SAMPLE);
    const [theme, setTheme] = React.useState("light");
    const [disabled, setDisabled] = React.useState(false);
    const [html, setHtml] = React.useState("");
    const [log, setLog] = React.useState([]);

    const addLog = (text) => setLog((items) => [`${new Date().toLocaleTimeString()} ${text}`, ...items].slice(0, 20));

    React.useEffect(() => {
        md2html(value).then(setHtml);
    }, [value]);

    const toggleDisabled = () => {
        if (disabled) {
            editorRef.current.enable();
        } else {
            editorRef.current.disabled();
        }
        setDisabled(!disabled);
    };

    // 主題用 VditorThemeProvider 給整頁，編輯器與預覽一起跟著切換
    return <VditorThemeProvider theme={theme}>
        <header>
            <h1>@wyttime04/react-vditor · React {React.version}</h1>
            <label>主題 <select value={theme} onChange={(event) => setTheme(event.target.value)}>
                <option value="light">light</option>
                <option value="dark">dark</option>
                <option value="auto">auto（跟著作業系統）</option>
            </select></label>
            <button onClick={() => setValue(SAMPLE)}>重設範例內容</button>
            <button onClick={() => editorRef.current.insertValue("**插入的文字**")}>insertValue</button>
            <button onClick={toggleDisabled}>{disabled ? "enable" : "disabled"}</button>
            <button onClick={() => addLog(`getValue：${JSON.stringify(editorRef.current.getValue()).slice(0, 80)}…`)}>getValue</button>
        </header>
        <main>
            <section>
                <h2>&lt;Vditor&gt;</h2>
                <Vditor
                    ref={editorRef}
                    value={value}
                    height={520}
                    input={(next) => {
                        setValue(next);
                        addLog(`input（${next.length} 字）`);
                    }}
                    // 開發用：不真的上傳，用 blob: 網址直接顯示選到的圖片
                    upload={{
                        handler: (files) => {
                            files.forEach((file) => editorRef.current.insertValue(`![${file.name}](${URL.createObjectURL(file)})\n`));
                            addLog(`upload.handler：${files.map((file) => file.name).join("、")}`);
                            return null;
                        },
                    }}
                    after={() => addLog("after")}
                    focus={() => addLog("focus")}
                    blur={() => addLog("blur")}
                />
                <h2>事件</h2>
                <ol className="log">{log.map((item, index) => <li key={index}>{item}</li>)}</ol>
            </section>
            <section>
                <h2>&lt;VditorPreview&gt;</h2>
                <VditorPreview value={value}/>
                <h2>md2html()</h2>
                <pre className="output">{html}</pre>
            </section>
        </main>
    </VditorThemeProvider>;
};

ReactDOM.render(<React.StrictMode><App/></React.StrictMode>, document.getElementById("root"));
