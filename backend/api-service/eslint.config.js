const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node,  // Cela définit console, process, exports, etc.
                ...globals.jest  // Cela définit describe, it, expect pour tes tests
            }
        },
        rules: {
            "no-unused-vars": "warn", // Les variables non utilisées passent en orange (warning)
            "no-console": "off",      // On autorise les console.log pour ton POC
            "no-undef": "error"
        }
    }
];