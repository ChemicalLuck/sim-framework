import { simEslintConfig } from '@chemicalluck/config/eslint';

export default simEslintConfig({
  tsconfigRootDir: import.meta.dirname,
  projects: ['./tsconfig.json'],
});
