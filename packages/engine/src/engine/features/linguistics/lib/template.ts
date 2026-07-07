import { subRng } from '@chemicalluck/engine/features/rng/lib/rng';
import { addIndefiniteArticle } from '@chemicalluck/engine/lib/linguistics';

import type { LinguisticsMacroParam, LinguisticsTerm } from '../types';

/** A macro after parsing: its declared parameters and the parsed body nodes. */
export interface CompiledMacro {
  params: LinguisticsMacroParam[];
  body: TemplateNode[];
}

/**
 * Everything the renderer needs. `vars` holds every value a template can
 * reference, keyed by (optionally dotted) name: the player's bare attributes
 * (`age`, `height`, pronoun fields like `subject`/`noun`, appearance features),
 * each character namespaced (`npc0.firstName`, `npc0.subject`, `player.height`),
 * and global narrative vars (`timeOfDay`, `weather`, …). `wordChoices` are the
 * player's per-term overrides; `seed` makes `{word:…}` picks deterministic;
 * `macros`/`terms` are the configured vocabulary. When `strict`, a sentence
 * referencing a missing var is dropped (descriptions); otherwise the literal
 * `{token}` is kept (general text). `paramSubs` is set internally during macro
 * expansion to rewrite parameter-prefixed lookups (`c.bodyFat` → `npc0.bodyFat`).
 */
export interface TemplateContext {
  vars: Record<string, string | number>;
  wordChoices: Record<string, string>;
  seed: string | number;
  macros: ReadonlyMap<string, CompiledMacro>;
  terms: ReadonlyMap<string, LinguisticsTerm>;
  strict?: boolean;
  paramSubs?: ReadonlyMap<string, string>;
}

const MAX_MACRO_DEPTH = 16;

/** Rewrite a variable name's leading dotted prefix through the active param
 * substitutions, so `c.bodyFat` (inside a macro with param `c` bound to `npc0`)
 * becomes `npc0.bodyFat` before lookup. */
function lookupVarName(name: string, ctx: TemplateContext): string {
  if (!ctx.paramSubs || ctx.paramSubs.size === 0) return name;
  const dot = name.indexOf('.');
  if (dot <= 0) return name;
  const sub = ctx.paramSubs.get(name.slice(0, dot));
  if (sub === undefined) return name;
  return `${sub}${name.slice(dot)}`;
}

// ── Variable + condition resolution ─────────────────────────────────────────────

function resolveVariable(
  name: string,
  ctx: TemplateContext,
): number | string | undefined {
  const value = ctx.vars[lookupVarName(name, ctx)];
  return value === '' ? undefined : value;
}

const CONDITION_RE = /^(.+?)\s*(>=|<=|==|!=|>|<)\s*(.+)$/;

/**
 * Evaluate a condition: comparisons (`height >= 180`, `gender == Female`, quoted
 * RHS allowed) and bare existence/truthiness tests (`hairColor`). Unknown
 * variables evaluate to `false`.
 */
function evaluateCondition(expr: string, ctx: TemplateContext): boolean {
  const match = CONDITION_RE.exec(expr.trim());
  if (!match) {
    const value = resolveVariable(expr.trim(), ctx);
    return value !== undefined && value !== '';
  }

  const [, lhsName, op, rhsRaw] = match;
  const lhs = resolveVariable(lhsName.trim(), ctx);
  if (lhs === undefined) return false;

  const rhsTrimmed = rhsRaw.trim();
  const rhsNum = Number(rhsTrimmed);
  if (typeof lhs === 'number' && rhsTrimmed !== '' && !Number.isNaN(rhsNum)) {
    switch (op) {
      case '>=':
        return lhs >= rhsNum;
      case '<=':
        return lhs <= rhsNum;
      case '>':
        return lhs > rhsNum;
      case '<':
        return lhs < rhsNum;
      case '==':
        return lhs === rhsNum;
      case '!=':
        return lhs !== rhsNum;
    }
  }

  const rhsStr = rhsTrimmed.replace(/^['"]|['"]$/g, '');
  const lhsStr = String(lhs);
  if (op === '==') return lhsStr === rhsStr;
  if (op === '!=') return lhsStr !== rhsStr;
  return false;
}

/**
 * Resolve the player's word for a `{word:key}` term. The effective pool is the
 * player's comma-separated override (duplicates kept, so repeats weight the
 * pick) or the term's authored options. One entry is chosen uniformly by index
 * (duplicates ⇒ higher odds) via an RNG seeded from the context — stable per
 * context, varied across characters/playthroughs. Empty/unknown → ''.
 */
function resolveWord(key: string, ctx: TemplateContext): string {
  const override = key in ctx.wordChoices ? ctx.wordChoices[key] : '';
  const pool: string[] = override.trim()
    ? override
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean)
    : (ctx.terms.get(key)?.options ?? []);
  if (pool.length === 0) return '';
  if (pool.length === 1) return pool[0];
  const masterSeed = typeof ctx.seed === 'number' ? ctx.seed : 0;
  const rng = subRng(masterSeed, `word:${String(ctx.seed)}:${key}`);
  return pool[Math.floor(rng.next() * pool.length)];
}

/**
 * Resolve a single `{…}` substitution token. Returns the string, or `null` when
 * the token references a variable with no value. Supported: `{name}` (any var,
 * dotted ok), `{word:key}` (player-chosen synonym, never null), `{lower:name}`,
 * `{a:name}` (indefinite article + lowercased), `{cap:name}` (capitalise first
 * letter — e.g. a sentence-leading pronoun).
 */
function resolveToken(token: string, ctx: TemplateContext): string | null {
  let modifier: 'lower' | 'a' | 'cap' | 'word' | null = null;
  let name = token;
  const colon = token.indexOf(':');
  if (colon !== -1) {
    const prefix = token.slice(0, colon);
    if (
      prefix === 'lower' ||
      prefix === 'a' ||
      prefix === 'cap' ||
      prefix === 'word'
    ) {
      modifier = prefix;
      name = token.slice(colon + 1);
    }
  }

  if (modifier === 'word') return resolveWord(name, ctx);

  const resolvedName = lookupVarName(name, ctx);
  if (!(resolvedName in ctx.vars)) return null;
  const value = ctx.vars[resolvedName];
  if (value === '') return null;
  const str = String(value);
  if (modifier === 'lower') return str.toLowerCase();
  if (modifier === 'a') return addIndefiniteArticle(str.toLowerCase());
  if (modifier === 'cap') return str.charAt(0).toUpperCase() + str.slice(1);
  return str;
}

// ── Parsing (text, substitutions, macros, if/elif/else/{/if} conditionals) ──────

export type TemplateNode =
  | { kind: 'text'; value: string }
  | { kind: 'token'; token: string }
  | { kind: 'macro'; name: string; args: string[] }
  | {
      kind: 'cond';
      branches: { condition: string | null; body: TemplateNode[] }[];
    };

type RawToken =
  | { kind: 'text'; value: string }
  | { kind: 'tag'; value: string };

/**
 * Collapse "structural" whitespace in a literal text run the way JSX does, so a
 * template (especially a macro body) can be indented and wrapped across lines
 * for readability without that layout leaking into the rendered output. A run
 * with no newline is returned untouched — inline spacing is significant
 * (`a   b` stays `a   b`). A run containing one or more newlines has its blank
 * lines dropped and each line's surrounding indentation trimmed; the remaining
 * lines join with a single space, and leading/trailing line breaks (the kind
 * that sit between a tag and the edge of a line) vanish entirely. So
 *
 *   {if c.height >= 185}
 *     {word:veryTall}
 *   {else}
 *     {word:short}
 *   {/if}
 *
 * renders as just `veryTall` / `short` with no stray whitespace, while
 *
 *   {cap:subject} has
 *   {hairColor} hair
 *
 * keeps the word spacing → `She has brown hair`.
 */
function collapseWhitespace(text: string): string {
  if (!text.includes('\n')) return text;
  const lines = text.split(/\r\n|\n|\r/);
  let lastNonEmpty = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/\S/.test(lines[i])) lastNonEmpty = i;
  }
  let out = '';
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\t/g, ' ');
    if (i !== 0) line = line.replace(/^ +/, '');
    if (i !== lines.length - 1) line = line.replace(/ +$/, '');
    if (!line) continue;
    out += i !== lastNonEmpty ? `${line} ` : line;
  }
  return out;
}

function tokenize(template: string): RawToken[] {
  const tokens: RawToken[] = [];
  const regex = /\{([^}]*)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  const pushText = (value: string) => {
    const collapsed = collapseWhitespace(value);
    if (collapsed) tokens.push({ kind: 'text', value: collapsed });
  };
  while ((match = regex.exec(template)) !== null) {
    if (match.index > last) {
      pushText(template.slice(last, match.index));
    }
    tokens.push({ kind: 'tag', value: match[1].trim() });
    last = regex.lastIndex;
  }
  if (last < template.length) {
    pushText(template.slice(last));
  }
  return tokens;
}

const tagHead = (value: string): string => value.split(/\s+/)[0];

/** Parse a run of nodes until a block terminator (`elif`/`else`/`/if`) or EOF. */
function parseNodes(
  tokens: RawToken[],
  start: number,
): { nodes: TemplateNode[]; next: number } {
  const nodes: TemplateNode[] = [];
  let i = start;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.kind === 'text') {
      nodes.push({ kind: 'text', value: tok.value });
      i++;
      continue;
    }
    const head = tagHead(tok.value);
    if (head === 'elif' || head === 'else' || head === '/if') break;
    if (head === 'if') {
      const { node, next } = parseConditional(tokens, i);
      nodes.push(node);
      i = next;
      continue;
    }
    if (tok.value.startsWith('@')) {
      const parts = tok.value.slice(1).split(/\s+/).filter(Boolean);
      const name = parts[0] ?? '';
      const args = parts.slice(1);
      nodes.push({ kind: 'macro', name, args });
      i++;
      continue;
    }
    nodes.push({ kind: 'token', token: tok.value });
    i++;
  }
  return { nodes, next: i };
}

/** Parse an `{if …}…{elif …}…{else}…{/if}` block; tokens[start] is the `if` tag. */
function parseConditional(
  tokens: RawToken[],
  start: number,
): { node: TemplateNode; next: number } {
  const branches: { condition: string | null; body: TemplateNode[] }[] = [];
  let condition: string | null = (tokens[start] as { value: string }).value
    .slice(2)
    .trim();
  let i = start + 1;
  while (i < tokens.length) {
    const { nodes, next } = parseNodes(tokens, i);
    branches.push({ condition, body: nodes });
    i = next;
    if (i >= tokens.length) break;
    const term = tokens[i];
    if (term.kind !== 'tag') break;
    const head = tagHead(term.value);
    if (head === '/if') {
      i++;
      break;
    }
    if (head === 'elif') {
      condition = term.value.slice(4).trim();
      i++;
      continue;
    }
    if (head === 'else') {
      condition = null;
      i++;
      continue;
    }
    break;
  }
  return { node: { kind: 'cond', branches }, next: i };
}

/** Parse a template string into nodes (used by `config` to pre-parse macros). */
export function parseTemplate(template: string): TemplateNode[] {
  return parseNodes(tokenize(template), 0).nodes;
}

// ── Rendering ───────────────────────────────────────────────────────────────────

/** Validate a macro arg against its declared param type. Only `Character`
 * exists today: the arg must be a known entity prefix in `ctx.vars`
 * (sentinel: `<arg>.firstName`). */
function isValidMacroArg(
  arg: string,
  _param: LinguisticsMacroParam,
  ctx: TemplateContext,
): boolean {
  return `${arg}.firstName` in ctx.vars;
}

/** Render nodes; returns `null` if a substitution token is unresolved. */
function renderNodes(
  nodes: TemplateNode[],
  ctx: TemplateContext,
  expanding: Set<string>,
  depth: number,
): string | null {
  let out = '';
  for (const node of nodes) {
    if (node.kind === 'text') {
      out += node.value;
    } else if (node.kind === 'token') {
      const resolved = resolveToken(node.token, ctx);
      if (resolved === null) {
        // Strict (descriptions): drop the whole sentence. Lenient (general
        // text): keep the literal `{token}` so authoring mistakes are visible.
        if (ctx.strict) return null;
        out += `{${node.token}}`;
      } else {
        out += resolved;
      }
    } else if (node.kind === 'macro') {
      const macro = ctx.macros.get(node.name);
      if (!macro) continue; // unknown macro → silent (lint catches this)
      if (depth >= MAX_MACRO_DEPTH) {
        if (ctx.strict) return null;
        continue;
      }
      // Resolve args through the caller's paramSubs so a macro can forward its
      // own params (`{@outer x}` → `{@inner x}` → concrete prefix at the top).
      const resolvedArgs = node.args.map(
        (arg) => ctx.paramSubs?.get(arg) ?? arg,
      );
      // Arity + per-arg Character validation. Failures emit empty (drop in strict).
      if (resolvedArgs.length !== macro.params.length) {
        if (ctx.strict) return null;
        continue;
      }
      const argsValid = macro.params.every((p, i) =>
        isValidMacroArg(resolvedArgs[i], p, ctx),
      );
      if (!argsValid) {
        if (ctx.strict) return null;
        continue;
      }
      // Cycle key includes resolved args, so `{@a npc0}` calling `{@a npc1}`
      // is not a false cycle.
      const cycleKey = `${node.name}\x1f${resolvedArgs.join('\x1f')}`;
      if (expanding.has(cycleKey)) continue;
      const paramSubs = new Map(
        macro.params.map((p, i) => [p.name, resolvedArgs[i]]),
      );
      expanding.add(cycleKey);
      const rendered = renderNodes(
        macro.body,
        { ...ctx, paramSubs },
        expanding,
        depth + 1,
      );
      expanding.delete(cycleKey);
      if (rendered === null) return null;
      out += rendered;
    } else {
      const branch = node.branches.find(
        (b) => b.condition === null || evaluateCondition(b.condition, ctx),
      );
      if (branch) {
        const rendered = renderNodes(branch.body, ctx, expanding, depth);
        if (rendered === null) return null;
        out += rendered;
      }
    }
  }
  return out;
}

/**
 * Render one template string. Returns the rendered text verbatim, or `null`
 * when `ctx.strict` and a referenced variable is missing. Structural whitespace
 * (newlines + indentation used to lay a template out for readability) is
 * collapsed at parse time by `collapseWhitespace`; inline spacing within a line
 * is preserved. The description path additionally normalises any remaining
 * runs in `renderSentences`.
 */
export function renderTemplate(
  template: string,
  ctx: TemplateContext,
): string | null {
  return renderNodes(parseTemplate(template), ctx, new Set(), 0);
}

/**
 * Render a template for general game text. Unresolved variables keep their
 * literal `{token}` (lenient), so this never returns null.
 */
export function renderText(template: string, ctx: TemplateContext): string {
  return renderTemplate(template, { ...ctx, strict: false }) ?? template;
}

/**
 * Render a list of sentence templates, dropping any whose emitted text
 * references a missing variable, collapsing whitespace, and joining survivors
 * with a space. Used for character descriptions (strict).
 */
export function renderSentences(
  sentences: string[],
  ctx: TemplateContext,
): string {
  return sentences
    .map((sentence) => renderTemplate(sentence, { ...ctx, strict: true }))
    .filter((sentence): sentence is string => !!sentence)
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .join(' ');
}
