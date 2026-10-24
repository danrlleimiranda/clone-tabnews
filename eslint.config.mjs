import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["**/*.test.*", "**/*.spec.*"],
    settings: {
      next: {
        rootDir: ".",
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      "no-unused-vars": "error",
    },
  },
  prettier,
]);
