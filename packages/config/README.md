# @chemicalluck/sim-config

Shared TypeScript, ESLint, and Prettier presets for the **sim** framework and the games
built on it. Scaffolded games already extend these; you rarely install it directly.

## TypeScript

```jsonc
// tsconfig.json
{ "extends": "@chemicalluck/sim-config/tsconfig/game.json" }
```

Also available: `@chemicalluck/sim-config/tsconfig/base.json` and
`@chemicalluck/sim-config/tsconfig/node.json`.

## ESLint

```js
// eslint.config.js
import { simEslintConfig } from '@chemicalluck/sim-config/eslint';

export default simEslintConfig({ tsconfigRootDir: import.meta.dirname });
```

## Prettier

```js
// prettier.config.js
export { default } from '@chemicalluck/sim-config/prettier';
```

📖 [Documentation](https://github.com/ChemicalLuck/sim-framework/wiki)
