// 測試用的頁面：把掛載、更新 props、卸載等操作掛在 window.harness，由 puppeteer 呼叫
import * as React from "react";
import * as ReactDOM from "react-dom";
import {md2html, Vditor, VditorPreview, VditorThemeProvider} from "../../../src/index.js";

const container = document.getElementById("root");

const events = [];
const ref = React.createRef();
/** 目前掛載的內容：{kind: "editor" | "preview" | "pair", props, strict, controlled, echoDelay, provider} */
let mounted = null;

/**
 * 受控用法：像一般使用端一樣把 input 回傳的內容存進 state 再傳回 value。
 * echoDelay：隔幾毫秒才存進 state，模擬非同步的 store、debounce 等回音晚到的使用端
 */
const Controlled = ({echoDelay, ...props}) => {
    const [value, setValue] = React.useState(props.value);
    return <Vditor ref={ref} {...props} value={value} after={() => events.push(["after"])} input={(next) => {
        events.push(["input", next]);
        if (echoDelay) {
            setTimeout(() => setValue(next), echoDelay);
        } else {
            setValue(next);
        }
    }}/>;
};

const draw = () => {
    const {kind, props, strict, controlled, echoDelay, provider} = mounted;
    const editor = (editorProps) => <Vditor ref={ref} {...editorProps}
                                            after={() => events.push(["after"])}
                                            input={(value) => events.push(["input", value])}/>;
    let element;
    if (kind === "preview") {
        element = <VditorPreview value="" {...props}/>;
    } else if (kind === "pair") {
        // 同一頁一個編輯器、一個預覽：props 是 {editor, preview}
        element = <>{editor(props.editor)}<VditorPreview value="" {...props.preview}/></>;
    } else {
        element = controlled ? <Controlled echoDelay={echoDelay} {...props}/> : editor(props);
    }
    if (provider) {
        element = <VditorThemeProvider theme={provider}>{element}</VditorThemeProvider>;
    }
    ReactDOM.render(strict ? <React.StrictMode>{element}</React.StrictMode> : element, container);
};

window.harness = {
    reactVersion: React.version,
    events,
    mount(kind, props, options = {}) {
        if (options.recordUpload) {
            // puppeteer 傳不了函式，所以在這裡補上：收到的檔案記進 events；recordUpload 是字串時當成錯誤訊息回傳
            props = {...props, upload: {...props.upload, handler: (files) => {
                events.push(["upload", [...files].map((file) => file.name)]);
                return typeof options.recordUpload === "string" ? options.recordUpload : null;
            }}};
        }
        mounted = {kind, props, strict: !!options.strict, controlled: !!options.controlled,
            echoDelay: options.echoDelay, provider: options.provider};
        draw();
    },
    update(patch) {
        mounted.props = {...mounted.props, ...patch};
        draw();
    },
    setProvider(theme) {
        mounted.provider = theme;
        draw();
    },
    unmount: () => ReactDOM.unmountComponentAtNode(container),
    ref: () => ref.current,
    md2html,
};
