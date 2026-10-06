const isPlainObject = (value) => Object.prototype.toString.call(value) === "[object Object]";

/** 物件逐層合併，陣列與其他值直接覆蓋 */
export const merge = (base, override) => {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return override === undefined ? base : override;
    }
    const result = {...base};
    Object.keys(override).forEach((key) => {
        result[key] = merge(result[key], override[key]);
    });
    return result;
};
