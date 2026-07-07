/** A typed parameter on a macro. The arg at the call site is bound to `name`
 * and used as a namespace prefix when expanding the body (`c.bodyFat` →
 * `npc0.bodyFat` when called as `{@build npc0}`). */
export interface LinguisticsMacroParam {
  name: string;
  type: 'Character';
}

/** A reusable named snippet written in the template mini-language, e.g. `{@stature}`.
 * Optional `params` enable namespace pass-through: a macro with
 * `params: [{ name: 'c', type: 'Character' }]` is invoked as `{@name npc0}` and
 * its body's `c.<field>` lookups resolve against `npc0.<field>` in the context. */
export interface LinguisticsMacro {
  name: string;
  params?: LinguisticsMacroParam[];
  template: string;
}

/**
 * A named vocabulary term with synonym `options` (first = default). Templates
 * reference it as `{word:key}`; the player can override the pool per term.
 */
export interface LinguisticsTerm {
  key: string;
  label: string;
  options: string[];
}

export interface LinguisticsJsonData {
  macros: LinguisticsMacro[];
  terms: LinguisticsTerm[];
}
