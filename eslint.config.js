import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
  { files: ["**/*.js"], languageOptions: { globals: globals.browser } },
  {
    files: ["**/*.js"],
    plugins: { js },
    rules: {
      "no-unused-vars": "error",
      "no-undef": "warn",
    },
    extends: [
      "eslint:recommended",
      "next/core-web-vitals",
      "plugin:jest/recommended",
      "prettier",
    ],
  },
]);
