# @chemicalluck/config

Shared TypeScript, ESLint, and Prettier presets for the **sim** framework and the games
built on it. Scaffolded games already extend these; you rarely install it directly.

## TypeScript

```jsonc
// tsconfig.json
{ "extends": "@chemicalluck/config/tsconfig/game.json" }
```

Also available: `@chemicalluck/config/tsconfig/base.json` and
`@chemicalluck/config/tsconfig/node.json`.

## ESLint

```js
// eslint.config.js
import { simEslintConfig } from '@chemicalluck/config/eslint';

export default simEslintConfig({ tsconfigRootDir: import.meta.dirname });
```

## Prettier

```js
// prettier.config.js
export { default } from '@chemicalluck/config/prettier';
```

📖 [Documentation](https://github.com/ChemicalLuck/sim-framework/wiki)
