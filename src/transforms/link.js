// 網址不合法的連結變成純文字：拿掉 <a>，只留下連結文字（含粗體等格式）。
// Lute 的 sanitize 只會清掉 javascript: 開頭的 href，data:、vbscript: 等仍會輸出成連結，所以這裡再檢查一次。

// 規則取自 DOMPurify 的 src/regexp.ts：放行 http(s)、ftp(s)、mailto、tel 等協定，以及相對路徑
const IS_ALLOWED_URI = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;
const ATTR_WHITESPACE = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g;

const isAllowedUri = (url) => IS_ALLOWED_URI.test(url.replace(ATTR_WHITESPACE, ""));

/**
 * 用 <template> 解析，裡面的 script 不會執行、圖片也不會載入。
 * 沒有要拆的連結時原樣回傳：重新序列化會改變輸出的寫法（例如 <img … /> 變成 <img …>）
 */
export const linkTransform = (html) => {
    const template = document.createElement("template");
    template.innerHTML = html;
    let changed = false;
    template.content.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href");
        if (href === null || !isAllowedUri(href)) {
            a.replaceWith(...a.childNodes);
            changed = true;
        }
    });
    return changed ? template.innerHTML : html;
};
