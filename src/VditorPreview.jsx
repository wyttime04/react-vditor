import * as React from "react";
import VditorCore from "vditor";
import {defaultCdn} from "./cdn.js";
import {gfmPreviewOptions} from "./gfm.js";
import {themeClassName, useResolvedTheme} from "./theme.js";

/**
 * 只渲染 Markdown、不建立編輯器（包 Vditor.preview）。
 * 內容的 prop 叫 value 而不是 markdown：IPreviewOptions 已經有 markdown，是語法設定。
 */
export const VditorPreview = (props) => {
    const {value, theme: themeProp, className, style, ...options} = props;
    const theme = useResolvedTheme(themeProp);
    const elementRef = React.useRef(null);
    // 選項常常是每次 render 都新建的物件；用內容比較，避免每次 render 都重新渲染
    const optionsKey = JSON.stringify(options);

    React.useEffect(() => {
        VditorCore.preview(elementRef.current, value, gfmPreviewOptions(options, options.cdn || defaultCdn()));
    }, [value, optionsKey]);   // options 以內容比較（optionsKey），不放物件本身

    // 主題只看外層容器的 class（index.css 裡局部化的樣式），換主題不用重新渲染；
    // 內層交給 Vditor.preview，它會在上面加 vditor-reset
    const wrapperClassName = ["react-vditor-preview", themeClassName(theme), className].filter(Boolean).join(" ");
    return <div className={wrapperClassName} style={style}>
        <div ref={elementRef}/>
    </div>;
};
