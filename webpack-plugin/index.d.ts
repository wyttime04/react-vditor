import type {Compiler} from "webpack";

/** 把 vditor 執行期要載入的資源（只含 GFM 用得到的部分）輸出到 webpack output 的 vditor/dist/ 底下 */
declare class VditorAssetsPlugin {
    apply(compiler: Compiler): void;
}

export = VditorAssetsPlugin;
