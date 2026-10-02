// 主題：只有 light / dark，外加跟著作業系統的 auto。
// 決定順序：元件自己的 theme prop → 最近的 <VditorThemeProvider> → light。
import * as React from "react";

const ThemeContext = React.createContext(undefined);

/** 讓底下所有 <Vditor>、<VditorPreview> 預設用同一個主題；值變動時它們會跟著切換 */
export const VditorThemeProvider = ({theme, children}) =>
    React.createElement(ThemeContext.Provider, {value: theme}, children);

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** 作業系統目前是不是深色模式；系統切換時會重新 render */
const useSystemDark = (enabled) => {
    const [dark, setDark] = React.useState(() => enabled && window.matchMedia(DARK_QUERY).matches);
    React.useEffect(() => {
        if (!enabled) {
            return undefined;
        }
        const query = window.matchMedia(DARK_QUERY);
        const update = () => setDark(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, [enabled]);
    return dark;
};

/** 算出元件實際要用的主題："light" 或 "dark" */
export const useResolvedTheme = (theme) => {
    const provided = React.useContext(ThemeContext);
    const wanted = theme || provided || "light";
    const systemDark = useSystemDark(wanted === "auto");
    if (wanted === "auto") {
        return systemDark ? "dark" : "light";
    }
    return wanted === "dark" ? "dark" : "light";
};

/** 容器上的 class，對應 index.css 裡局部化的主題樣式 */
export const themeClassName = (theme) => `react-vditor--${theme}`;
