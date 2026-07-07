/** Shared Prettier config for sim games and framework packages. */
const config = {
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  trailingComma: 'all',
  singleQuote: true,
  semi: true,
  importOrder: ['^@chemicalluck/(.*)$', '^~/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};

export default config;
