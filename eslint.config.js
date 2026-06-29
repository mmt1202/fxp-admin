import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const apiDirectory = 'api';
const deprecatedApiDirectory = `${apiDirectory}/modules`;

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                `./${deprecatedApiDirectory}`,
                `./${deprecatedApiDirectory}/*`,
                `../${deprecatedApiDirectory}`,
                `../${deprecatedApiDirectory}/*`,
                `../../${deprecatedApiDirectory}`,
                `../../${deprecatedApiDirectory}/*`,
                `@/${deprecatedApiDirectory}`,
                `@/${deprecatedApiDirectory}/*`,
                `src/${deprecatedApiDirectory}`,
                `src/${deprecatedApiDirectory}/*`,
              ],
              message: '旧 API 模块目录已移除，请改从 src/api/index.ts 或具体业务 API 文件导入。',
            },
          ],
        },
      ],
    },
  },
);
