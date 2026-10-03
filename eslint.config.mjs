// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

/**
 * Root flat config for the whole monorepo (artifacts/cintexa, artifacts/api-server,
 * lib/db, functions). Uses typescript-eslint's *syntactic* recommended rules rather
 * than the type-checked variant, so it runs fast and doesn't need every workspace's
 * tsconfig wired into `project` — `npm run typecheck` already does full type-checking
 * separately. If you later want type-aware rules (no-floating-promises, no-misused-
 * promises, etc.), swap `tseslint.configs.recommended` below for
 * `tseslint.configs.recommendedTypeChecked` and add `languageOptions.parserOptions
 * .projectService: true`.
 */
export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/node_modules/**",
      "lib/db/drizzle/**",
      "artifacts/cintexa/public/**",
      "**/*.d.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React web app: browser globals + hooks rules + Vite fast-refresh rule.
  // (eslint-plugin-react removed: its peer range still caps at ESLint 9.7 while
  // this monorepo uses ESLint 10 — that ERESOLVE broke Cloudflare Pages `npm ci`.)
  {
    files: ["artifacts/cintexa/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs["recommended-latest"].rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // react-hooks v7 rule aimed at React Compiler; legitimate setState-in-effect
      // patterns (WebGL probe, localStorage hydrate) stay as warnings.
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  // Express API, shared db package, prerender scripts, and Cloudflare Pages
  // functions: Node globals (console, process, etc).
  {
    files: ["artifacts/api-server/**/*.ts", "lib/db/**/*.ts", "functions/**/*.ts", "artifacts/cintexa/scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Common TS ergonomics: let intentionally-unused args/catch bindings be prefixed
  // with `_` instead of either erroring or silently allowing dead variables.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
);
