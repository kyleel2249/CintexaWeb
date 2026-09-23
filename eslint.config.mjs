// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
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

  // React web app: browser globals + core React rules + hooks rules + Vite
  // fast-refresh rule.
  {
    files: ["artifacts/cintexa/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: { version: "19.0" },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules, // React 19: no `import React` / no `React` in scope required
      ...reactHooks.configs["recommended-latest"].rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // React 19 no longer requires prop-types (TypeScript covers this here).
      "react/prop-types": "off",
      // This rule (new in react-hooks v7, aimed at React Compiler compatibility) flags
      // *any* setState call inside an effect body, including the ordinary "sync one
      // piece of client-only state on mount" pattern this codebase uses deliberately
      // (e.g. useWebGL.ts detecting WebGL support, DashboardShell/Progress/Settings
      // hydrating from localStorage after mount). Those are legitimate — you can't
      // read `localStorage`/`canvas` during render — so this is downgraded to a
      // warning to flag it for review per-case rather than hard-fail on correct code.
      "react-hooks/set-state-in-effect": "warn",
    },
  },

  // react-three-fiber scene components (Canvas/mesh/etc): these are R3F's own
  // Three.js scene-graph JSX intrinsics (position, rotation, args, metalness,
  // emissive, ...), not DOM elements, so react/no-unknown-property's DOM-attribute
  // allowlist doesn't know them and flags every one as an error. This is a known,
  // common false-positive with eslint-plugin-react + R3F — turning the rule off
  // only for the three files that actually render R3F JSX, confirmed by grepping
  // for '@react-three/fiber' imports (BrandReveal3D/BusinessEcosystem3D/
  // Storefront3D), not for the app at large.
  {
    files: ["artifacts/cintexa/src/components/scene/*.tsx"],
    rules: {
      "react/no-unknown-property": "off",
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
