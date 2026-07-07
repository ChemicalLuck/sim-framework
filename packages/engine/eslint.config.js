import { simEslintConfig } from '@chemicalluck/sim-config/eslint';

export default simEslintConfig({
  tsconfigRootDir: import.meta.dirname,
  projects: ['./tsconfig.json'],
});
