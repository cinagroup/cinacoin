/**
 * Cinacoin 统一 Tailwind CSS Preset
 *
 * 所有项目共享的品牌颜色、字体和命名约定。
 * 主品牌色: #3B82F6 (blue-500)
 */
export declare const cinacoinPreset: {
    theme: {
        extend: {
            colors: {
                brand: {
                    50: string;
                    100: string;
                    200: string;
                    300: string;
                    400: string;
                    500: string;
                    600: string;
                    700: string;
                    800: string;
                    900: string;
                };
                success: {
                    DEFAULT: string;
                    dark: string;
                };
                warning: {
                    DEFAULT: string;
                    dark: string;
                };
                danger: {
                    DEFAULT: string;
                    dark: string;
                };
                info: {
                    DEFAULT: string;
                    dark: string;
                };
                surface: {
                    DEFAULT: string;
                    hover: string;
                    border: string;
                    borderLight: string;
                };
            };
            fontFamily: {
                sans: string[];
                mono: string[];
            };
        };
    };
};
export default cinacoinPreset;
//# sourceMappingURL=tailwind-preset.d.ts.map