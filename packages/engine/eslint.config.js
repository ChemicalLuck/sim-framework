import { simEslintConfig } from '@sim/config/eslint';

export default simEslintConfig({
  tsconfigRootDir: import.meta.dirname,
  projects: ['./tsconfig.json'],
});
