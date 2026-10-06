// 非 GFM 的區塊（mermaid、數學式、echarts…）一律變成普通程式碼區塊；webpack plugin 也不會輸出那些渲染套件。

/** Lute 會把這些語言輸出成 <div class="language-xxx"> 等渲染器畫圖 */
const DIV_LANGUAGES = "mermaid|echarts|abc|graphviz|mindmap|flowchart|plantuml|infographic|math";
/** 這些語言輸出成 <pre><code class="language-xxx">，但渲染器一樣會找上門 */
const CODE_LANGUAGES = "smiles|wavedrom|markmap|math";

const DIV_PATTERN = new RegExp(`<div(?: data-code="[^"]*")? class="language-(${DIV_LANGUAGES})">([\\s\\S]*?)</div>`, "g");
const CODE_PATTERN = new RegExp(`<code class="language-(${CODE_LANGUAGES})">`, "g");
const INLINE_MATH_PATTERN = /<span class="language-math">([\s\S]*?)<\/span>/g;

/**
 * class 改成 language-plaintext，渲染器就找不到它們，也就不會去載入沒輸出的套件；原本的語言留在 data-lang。
 */
export const gfmTransform = (html) => html
    .replace(DIV_PATTERN, '<pre><code class="language-plaintext" data-lang="$1">$2</code></pre>')
    .replace(CODE_PATTERN, '<code class="language-plaintext" data-lang="$1">')
    .replace(INLINE_MATH_PATTERN, "$$$1$$");
