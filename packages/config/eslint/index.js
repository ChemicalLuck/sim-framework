import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import react from 'eslint-plugin-react-x';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Shared flat ESLint config for sim games and framework packages.
 *
 * @param {object} [options]
 * @param {string[]} [options.tsconfigRootDir] tsconfigRootDir for typed linting.
 * @param {string[]} [options.projects] tsconfig project paths (relative to root).
 * @param {string[]} [options.ignores] extra ignore globs.
 * @returns {import('eslint').Linter.Config[]}
 */
export function simEslintConfig(options = {}) {
  const {
    tsconfigRootDir = process.cwd(),
    projects = ['./tsconfig.json'],
    ignores = [],
  } = options;

  return [
    { ignores: ['dist', 'src/**/components/ui', ...ignores] },
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        js.configs.recommended,
        tseslint.configs.strictTypeChecked,
        tseslint.configs.stylisticTypeChecked,
        react.configs['strict-type-checked'],
        reactHooks.configs['recommended-latest'],
        reactRefresh.configs.vite,
      ],
      languageOptions: {
        parserOptions: {
          project: projects,
          tsconfigRootDir,
        },
        globals: globals.browser,
      },
    },
  ];
}

export default simEslintConfig;
