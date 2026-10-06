import * as React from "react";
import VditorCore from "vditor";
import {editorOptions} from "./options/default.js";
import {themeClassName, useResolvedTheme} from "./theme.js";

/**
 * ref 上可以呼叫的方法，名稱與原生 vditor 相同。型別見 index.d.ts 的 VditorRef。
 * 不開放 destroy（由元件管理）與 setTheme（主題由 theme prop 控制；原生 setTheme 會插入整頁共用的主題樣式）
 */
const COMMANDS = [
    "updateToolbarConfig", "focus", "blur", "disabled", "enable", "renderPreview",
    "clearCache", "disabledCache", "enableCache", "tip", "setPreviewMode", "deleteValue", "updateValue",
    "insertValue", "insertMD", "setValue", "insertEmptyBlock", "clearStack",
    "hlCommentIds", "unHlCommentIds", "removeCommentIds",
];
const QUERIES = [
    "getValue", "getCurrentMode", "getSelection", "getCursorPosition", "isUploading",
    "html2md", "exportJSON", "getHTML", "getCommentIds",
];

/** 變動時重建編輯器，內容會保留 */
const RECREATE_KEYS = ["mode", "lang", "toolbar", "icon", "cdn", "height"];
/** 回呼一律轉呼叫最新的 props，變動時不重建 */
const CALLBACK_KEYS = [
    "after", "input", "focus", "blur", "keydown", "esc", "ctrlEnter", "select", "unSelect",
    "customWysiwygToolbar", "customWysiwygMobileToolbar",
];
/** 由元件自己處理或與編輯器無關的 props */
const HANDLED_KEYS = ["value", "theme", "className", "style", ...RECREATE_KEYS, ...CALLBACK_KEYS];

/** 我們的 light / dark 對應到 vditor 編輯器外框的 classic / dark；內容主題與程式碼主題由容器的 class 決定 */
const editorTheme = (theme) => (theme === "dark" ? "dark" : "classic");

const isDevelopment = () => {
    try {
        return process.env.NODE_ENV !== "production";
    } catch {
        return false;
    }
};

/** vditor 編輯器。value 是初始值；之後使用端改 value 會套用，打字觸發的 input 回傳值不會被蓋回去 */
export const Vditor = React.forwardRef(function Vditor(props, ref) {
    const containerRef = React.useRef(null);
    const propsRef = React.useRef(props);
    propsRef.current = props;
    const theme = useResolvedTheme(props.theme);
    const themeRef = React.useRef(theme);
    themeRef.current = theme;

    /** ready 之後才有值；null 表示還沒 ready 或已卸載 */
    const editorRef = React.useRef(null);
    /** ready 前呼叫的方法，ready 後依序執行 */
    const queueRef = React.useRef([]);
    /** 編輯器目前的內容（ready 前是要給它的初始值），重建時用來保留內容；undefined 表示沒給 value，交給 vditor（例如讀快取） */
    const contentRef = React.useRef(props.value);
    /** input 回傳過、但使用端可能還沒同步回 value 的內容；value 等於其中之一就是回音，不套用 */
    const emittedRef = React.useRef([]);

    const recreateKey = JSON.stringify(RECREATE_KEYS.map((key) => props[key]));
    useUnappliedPropsWarning(props, recreateKey);

    React.useEffect(() => {
        const container = containerRef.current;
        // 每個實例用自己的 host：ready 前就卸載的實例，之後 vditor 還會往 host 裡建 DOM，不能碰到下一個實例
        const host = document.createElement("div");
        container.appendChild(host);
        let disposed = false;
        let ready = false;

        const callbacks = {};
        CALLBACK_KEYS.forEach((key) => {
            callbacks[key] = (...args) => propsRef.current[key]?.(...args);
        });
        callbacks.input = (value) => {
            contentRef.current = value;
            if (propsRef.current.value !== undefined) {
                // 只有受控用法才需要辨認回音；保留最近 100 筆就夠了
                emittedRef.current = emittedRef.current.slice(-99).concat(value);
            }
            propsRef.current.input?.(value);
        };
        callbacks.after = () => {
            if (disposed) {
                // ready 前就被卸載了（例如 React 18 StrictMode 的第一次掛載），現在才能正確 destroy
                instance.destroy();
                return;
            }
            // Lute 預設把 $…$ 當成數學式，GFM 沒有這個語法；關掉之後才放入內容，讓它原樣顯示成文字
            instance.vditor.lute.SetInlineMath(false);
            // ready 前主題若變過（例如 auto 跟著系統切換），這裡補上
            instance.setTheme(editorTheme(themeRef.current));
            // 用 contentRef：ready 前使用端若改過 value，這裡一併套用
            instance.setValue(contentRef.current ?? instance.getValue(), true);
            ready = true;
            editorRef.current = instance;
            const queue = queueRef.current;
            queueRef.current = [];
            queue.forEach((run) => run(instance));
            contentRef.current = instance.getValue();
            propsRef.current.after?.();
        };

        const {className, style, ...options} = propsRef.current;
        // 先用空內容建立，after 裡關掉行內數學式之後才放入真正的內容；否則初次渲染就會去載入 katex
        const instance = new VditorCore(host, {
            ...editorOptions({...options, value: "", theme: editorTheme(themeRef.current)}),
            ...callbacks,
        });

        return () => {
            disposed = true;
            editorRef.current = null;
            if (ready) {
                contentRef.current = instance.getValue();
                instance.destroy();
            } else {
                // vditor 在 init 之前 destroy 會拋錯；設這個內部旗標讓還沒開始的 init 直接結束
                instance.isDestroyed = true;
            }
            host.remove();
        };
    }, [recreateKey]);

    // value：跟編輯器內容不同、而且不是 input 的回音時才套用
    React.useEffect(() => {
        const value = props.value;
        if (value === undefined) {
            return;
        }
        const echoIndex = emittedRef.current.lastIndexOf(value);
        if (echoIndex >= 0) {
            emittedRef.current = emittedRef.current.slice(echoIndex + 1);
            return;
        }
        if (value === contentRef.current) {
            return;
        }
        contentRef.current = value;
        emittedRef.current = [];
        // 還沒 ready：after 裡會用 contentRef 放入內容
        editorRef.current?.setValue(value);
    }, [props.value]);

    // theme：外框用 setTheme 切換；內容主題與程式碼主題跟著容器的 class，不用重建
    React.useEffect(() => {
        // 還沒 ready：after 裡會用 themeRef 補上
        editorRef.current?.setTheme(editorTheme(theme));
    }, [theme]);

    React.useImperativeHandle(ref, () => {
        const handle = {};
        COMMANDS.forEach((name) => {
            handle[name] = (...args) => {
                const run = (instance) => instance[name](...args);
                const editor = editorRef.current;
                if (editor) {
                    return run(editor);
                }
                queueRef.current.push(run);
            };
        });
        QUERIES.forEach((name) => {
            handle[name] = (...args) => {
                const editor = editorRef.current;
                if (editor) {
                    return editor[name](...args);
                }
                // ready 前查不到真正的狀態，回傳已知的值
                if (name === "getValue") {
                    return contentRef.current ?? "";
                }
                if (name === "getCurrentMode") {
                    return propsRef.current.mode || "wysiwyg";   // 跟 options/default.js 的預設 mode 一致
                }
                return undefined;
            };
        });
        return handle;
    }, []);

    const className = [themeClassName(theme), props.className].filter(Boolean).join(" ");
    return <div ref={containerRef} className={className} style={props.style}/>;
});

/** 其他 props：編輯器建立後才變動的不會套用，開發模式下每個 prop 提醒一次 */
const useUnappliedPropsWarning = (props, recreateKey) => {
    /** 建立編輯器時的其他 props */
    const createdRef = React.useRef({});
    const warnedRef = React.useRef(new Set());

    React.useEffect(() => {
        createdRef.current = snapshotOtherProps(props);
    }, [recreateKey]);

    React.useEffect(() => {
        if (!isDevelopment()) {
            return;
        }
        const now = snapshotOtherProps(props);
        Object.keys({...now, ...createdRef.current}).forEach((key) => {
            if (now[key] !== createdRef.current[key] && !warnedRef.current.has(key)) {
                warnedRef.current.add(key);
                console.warn(`[react-vditor] prop "${key}" 在編輯器建立後變動不會套用；需要的話請改 key 讓元件重建`);
            }
        });
    });
};

const snapshotOtherProps = (props) => {
    const snapshot = {};
    Object.keys(props).forEach((key) => {
        if (!HANDLED_KEYS.includes(key)) {
            snapshot[key] = JSON.stringify(props[key]) ?? "";
        }
    });
    return snapshot;
};
