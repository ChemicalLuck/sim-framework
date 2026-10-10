import { templateVarDeclarations } from 'virtual:game-extensions';

import { extensionTemplateVarNames } from './lib/extension-vars';
import type { TemplateLintContext } from './lib/lint';

/**
 * Lint context entries for the game's extension template variables: each
 * declared `{<extension>.<key>}` as a variable, and extensions without
 * declared `keys` as namespaces whose every key is accepted.
 */
export function extensionTemplateLintVars(): Required<
  Pick<TemplateLintContext, 'variables' | 'extensionNamespaces'>
> {
  const { variables, namespaces } = extensionTemplateVarNames(
    templateVarDeclarations,
  );
  return { variables, extensionNamespaces: namespaces };
}
