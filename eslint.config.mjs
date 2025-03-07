import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
    {files: ["src/*.{js,mjs,cjs,ts}"]},
    {languageOptions: { globals: globals.browser }},
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "no-extra-boolean-cast": "off",
            "no-proto": 'error',
            "no-restricted-syntax": "error",

            "prefer-const": "warn",
            "eqeqeq": "warn",

            "no-inline-comments": "warn",
        }
    }
];
