/**
 * @cinaconnect/codemod — Codemods for migrating to CinaConnect
 *
 * CLI entry point that discovers and runs codemods.
 */
export { transformAppKitToCinaConnect } from "./codemods/appkit-to-cinaconnect.js.js";
export { transformWcV1ToV2 } from "./codemods/wc-v1-to-v2.js.js";
/** Map of transform name → transform function */
export const TRANSFORMS = {
    "appkit-to-cinaconnect": transformAppKitToCinaConnect,
    "wc-v1-to-v2": transformWcV1ToV2,
};
/** List all available transform names */
export function listTransforms() {
    return Object.keys(TRANSFORMS);
}
//# sourceMappingURL=index.js.map