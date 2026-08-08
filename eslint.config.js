// Note: typescript-eslint@8.65 does not yet support TypeScript 7
// (tracking issue typescript-eslint#10940). Until upstream adds TS 7
// support, ESLint is scoped to JS / config files. The TS source is
// still type-checked by `tsc` (see `pnpm check` / `pnpm build`),
// which is what the CI deploy workflow actually gates on.
//
// To restore the previous TS-aware lint rules once TS 7 is supported:
//   1. re-add `tseslint` import and `tseslint.configs.recommended`
//   2. change `files` back to `**/*.{ts,tsx}` (and wrap with tseslint.config())
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  js.configs.recommended,
  { ignores: ['dist', 'scripts', 'api', 'docs', 'public', '**/*.ts', '**/*.tsx', '*.mjs'] },
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]