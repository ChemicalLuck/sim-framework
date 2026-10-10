import type { RootState } from '@chemicalluck/sim-engine/state/store';

/** Value an extension may expose to templates. */
export type TemplateVarValue = string | number | boolean;

/**
 * Default export of an extension's `template-vars.ts`: derives template
 * variables from the current state. Keys are exposed as `{<extension>.<key>}`.
 */
export type TemplateVarProvider = (
  state: RootState,
) => Record<string, TemplateVarValue>;

/**
 * The exports of an extension's `template-vars.ts` the editor reads. `keys`
 * optionally declares the variables the provider returns, so the template
 * linter can check `{<extension>.<key>}` without running the game.
 */
export interface TemplateVarDeclaration {
  keys?: readonly string[];
}

/**
 * Variable names the linter should accept for extension template variables:
 * `<extension>.<key>` for each declared key, plus the names of extensions that
 * declare no keys (any `<extension>.<key>` of theirs is accepted).
 */
export function extensionTemplateVarNames(
  declarations: Record<string, TemplateVarDeclaration>,
): { variables: string[]; namespaces: string[] } {
  const variables: string[] = [];
  const namespaces: string[] = [];
  for (const [name, { keys }] of Object.entries(declarations)) {
    if (keys) variables.push(...keys.map((key) => `${name}.${key}`));
    else namespaces.push(name);
  }
  return { variables, namespaces };
}

/**
 * Run every extension's template-variable provider and namespace the results
 * under the extension name (`university` + `term` → `university.term`).
 * Booleans become `'true'` / `''` so `{if flag}` tests them and `false` reads
 * as unset.
 */
export function collectExtensionVars(
  providers: Record<string, TemplateVarProvider>,
  state: RootState,
): Record<string, string | number> {
  const vars: Record<string, string | number> = {};
  for (const [name, provider] of Object.entries(providers)) {
    for (const [key, value] of Object.entries(provider(state))) {
      vars[`${name}.${key}`] =
        typeof value === 'boolean' ? (value ? 'true' : '') : value;
    }
  }
  return vars;
}
