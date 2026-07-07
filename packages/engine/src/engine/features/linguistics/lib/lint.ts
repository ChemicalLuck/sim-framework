import type { LinguisticsMacroParam } from '../types';
import {
  BODY_VAR_NAMES,
  ENTITY_FIELD_NAMES,
  ENTITY_PREFIXES,
  PRONOUN_FIELDS,
} from './variables';

/** Defined macro shape known to the linter: name plus declared parameters. */
export interface MacroSignature {
  name: string;
  params: LinguisticsMacroParam[];
}

/** Identifiers a template may legally reference in a given authoring context. */
export interface TemplateLintContext {
  /** Variable names: `age`, body attrs, narrative globals, appearance feature ids. */
  variables: string[];
  /** Defined macros, with their parameter signatures. */
  macros: MacroSignature[];
  /** Defined term keys (referenced as `{word:key}`). */
  terms: string[];
  /** Appearance feature ids (`jawShape`, `hairColor`, …). Valid as a field on
   * any character, i.e. after a param/entity prefix (`{c.jawShape}`). */
  appearanceFeatures?: string[];
  /** Local parameter names in scope when linting a parametered macro's body.
   * Each is a valid `Character` arg when calling another parametered macro
   * (transitive pass-through), and disables the "bare attribute" footgun
   * warning's player-fallback semantics. */
  localParams?: LinguisticsMacroParam[];
}

export interface TemplateIssue {
  from: number;
  to: number;
  severity: 'error' | 'warning';
  message: string;
}

const MODIFIERS = ['lower', 'a', 'cap', 'word'];
const CONDITION_RE = /^(.+?)\s*(?:>=|<=|==|!=|>|<)\s*(.+)$/;

/**
 * Validate a template string against the known identifiers, returning issues
 * with character offsets. Errors are structural (empty tag, unbalanced
 * `{if}`/`{/if}`); warnings are unknown macro/term/variable/modifier references.
 * Pure — no CodeMirror dependency — so it is reused by the editor linter and by
 * data-integrity tests.
 */
export function lintTemplate(
  template: string,
  ctx: TemplateLintContext,
): TemplateIssue[] {
  const issues: TemplateIssue[] = [];
  const variables = new Set(ctx.variables);
  const pronouns = new Set(PRONOUN_FIELDS);
  const macroByName = new Map(ctx.macros.map((m) => [m.name, m]));
  const terms = new Set(ctx.terms);
  const localParamNames = new Set((ctx.localParams ?? []).map((p) => p.name));
  const entityPrefixes = new Set(ENTITY_PREFIXES);
  const characterFields = new Set([
    ...ENTITY_FIELD_NAMES,
    ...(ctx.appearanceFeatures ?? []),
  ]);
  // Bare entity fields inside a parametered macro body are almost always a
  // mistake (they silently come from the player). Pronoun fields stay legal
  // bare because pronouns are inherently positional in prose.
  const inParameteredBody = (ctx.localParams ?? []).length > 0;
  const bareFootgunFields = new Set([...ENTITY_FIELD_NAMES, ...BODY_VAR_NAMES]);
  for (const field of PRONOUN_FIELDS) bareFootgunFields.delete(field);
  const ifStack: { from: number; to: number }[] = [];

  const error = (from: number, to: number, message: string) => {
    issues.push({ from, to, severity: 'error', message });
  };
  const warn = (from: number, to: number, message: string) => {
    issues.push({ from, to, severity: 'warning', message });
  };

  const isKnownVar = (name: string) => {
    if (variables.has(name) || pronouns.has(name)) return true;
    // Inside a parametered macro body, dotted lookups whose prefix is a local
    // param (`c.bodyFat`) are valid — at runtime the prefix is rewritten to a
    // concrete namespace.
    if (inParameteredBody) {
      const dot = name.indexOf('.');
      if (dot > 0 && localParamNames.has(name.slice(0, dot))) {
        const field = name.slice(dot + 1);
        return characterFields.has(field) || pronouns.has(field);
      }
    }
    return false;
  };

  const isValidCharacterArg = (arg: string) =>
    entityPrefixes.has(arg) || localParamNames.has(arg);

  // Bare references like `{bodyFat}` inside a parametered macro silently
  // resolve to the player — almost always a mistake. Pronouns and narrative
  // globals stay legal bare.
  const warnIfBareFootgun = (name: string, from: number, to: number) => {
    if (inParameteredBody && bareFootgunFields.has(name)) {
      warn(
        from,
        to,
        `Bare "${name}" in a parametered macro resolves to the player; did you mean "<param>.${name}"?`,
      );
    }
  };

  const checkCondition = (cond: string, from: number, to: number) => {
    if (cond === '') {
      error(from, to, 'Empty condition');
      return;
    }
    const match = CONDITION_RE.exec(cond);
    const lhs = (match ? match[1] : cond).trim();
    if (!isKnownVar(lhs)) {
      warn(from, to, `Unknown variable "${lhs}" in condition`);
    } else {
      warnIfBareFootgun(lhs, from, to);
    }
  };

  const re = /\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(template)) !== null) {
    const from = match.index;
    const to = from + match[0].length;
    const raw = match[1].trim();
    const head = raw.split(/\s+/)[0];

    if (head === 'if') {
      checkCondition(raw.slice(2).trim(), from, to);
      ifStack.push({ from, to });
      continue;
    }
    if (head === 'elif') {
      if (ifStack.length === 0) error(from, to, "'{elif}' without '{if}'");
      else checkCondition(raw.slice(4).trim(), from, to);
      continue;
    }
    if (raw === 'else') {
      if (ifStack.length === 0) error(from, to, "'{else}' without '{if}'");
      continue;
    }
    if (raw === '/if') {
      if (ifStack.length === 0) error(from, to, "'{/if}' without '{if}'");
      else ifStack.pop();
      continue;
    }
    if (raw === '') {
      error(from, to, 'Empty {} tag');
      continue;
    }

    if (raw.startsWith('@')) {
      const parts = raw.slice(1).split(/\s+/).filter(Boolean);
      const name = parts[0] ?? '';
      const args = parts.slice(1);
      if (!name) {
        error(from, to, 'Empty macro name');
        continue;
      }
      const macro = macroByName.get(name);
      if (!macro) {
        warn(from, to, `Unknown macro "${name}"`);
        continue;
      }
      if (args.length !== macro.params.length) {
        warn(
          from,
          to,
          `Macro "${name}" expects ${String(macro.params.length)} argument${macro.params.length === 1 ? '' : 's'}, got ${String(args.length)}`,
        );
        continue;
      }
      // Only `Character` type exists today: validate every arg against the
      // entity-prefix / local-param set.
      for (let i = 0; i < macro.params.length; i++) {
        const arg = args[i];
        if (!isValidCharacterArg(arg)) {
          warn(
            from,
            to,
            `"${arg}" is not a known Character for macro "${name}"`,
          );
        }
      }
      continue;
    }

    const colon = raw.indexOf(':');
    if (colon !== -1) {
      const prefix = raw.slice(0, colon);
      const name = raw.slice(colon + 1);
      if (prefix === 'word') {
        if (!name) error(from, to, 'Empty term key');
        else if (!terms.has(name)) warn(from, to, `Unknown term "${name}"`);
      } else if (prefix === 'lower' || prefix === 'a' || prefix === 'cap') {
        if (!isKnownVar(name)) warn(from, to, `Unknown variable "${name}"`);
        else warnIfBareFootgun(name, from, to);
      } else if (!MODIFIERS.includes(prefix)) {
        warn(from, to, `Unknown modifier "${prefix}"`);
      }
      continue;
    }

    if (!isKnownVar(raw)) warn(from, to, `Unknown variable "${raw}"`);
    else warnIfBareFootgun(raw, from, to);
  }

  for (const open of ifStack) {
    error(open.from, open.to, "'{if}' is never closed with '{/if}'");
  }

  return issues;
}
