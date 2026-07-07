import {
  type Completion,
  type CompletionContext,
  type CompletionResult,
  autocompletion,
} from '@codemirror/autocomplete';
import {
  HighlightStyle,
  StreamLanguage,
  syntaxHighlighting,
} from '@codemirror/language';
import { type Diagnostic, linter } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import { tags } from '@lezer/highlight';
import {
  type TemplateLintContext,
  lintTemplate,
} from '@chemicalluck/engine/features/linguistics/lib/lint';
import { ENTITY_FIELD_NAMES } from '@chemicalluck/engine/features/linguistics/lib/variables';

interface TokenizerState {
  brace: boolean;
}

/**
 * Lightweight tokeniser for the template mini-language. Only the brace
 * constructs carry meaning; everything outside `{…}` is plain text.
 */
const templateLanguage = StreamLanguage.define<TokenizerState>({
  name: 'template',
  startState: () => ({ brace: false }),
  token(stream, state) {
    if (!state.brace) {
      if (stream.eat('{')) {
        state.brace = true;
        return 'punctuation';
      }
      // Consume plain text up to the next tag.
      while (!stream.eol() && stream.peek() !== '{') stream.next();
      return null;
    }

    if (stream.eat('}')) {
      state.brace = false;
      return 'punctuation';
    }
    if (stream.eatSpace()) return null;

    if (stream.match(/^\/if/)) return 'keyword';
    if (stream.match(/^(?:if|elif|else)\b/)) return 'keyword';
    if (stream.match(/^@[A-Za-z0-9_]+/)) return 'atom';
    if (stream.match(/^(?:lower|a|cap|word)\s*:/)) return 'keyword';
    if (stream.match(/^(?:>=|<=|==|!=|>|<)/)) return 'operator';
    if (stream.match(/^\d+(?:\.\d+)?/)) return 'number';
    if (stream.match(/^"[^"]*"/) || stream.match(/^'[^']*'/)) return 'string';
    if (stream.match(/^[A-Za-z0-9_]+/)) return 'variableName';

    stream.next();
    return null;
  },
});

const highlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#c084fc' },
  { tag: tags.atom, color: '#34d399' },
  { tag: tags.variableName, color: '#7dd3fc' },
  { tag: tags.number, color: '#fbbf24' },
  { tag: tags.operator, color: '#f472b6' },
  { tag: tags.string, color: '#fca5a5' },
  { tag: tags.punctuation, color: '#71717a' },
]);

const MODIFIER_COMPLETIONS: Completion[] = [
  { label: 'lower:', type: 'keyword', detail: 'lowercase a value' },
  { label: 'cap:', type: 'keyword', detail: 'capitalise first letter' },
  { label: 'a:', type: 'keyword', detail: 'add a/an + lowercase' },
  { label: 'word:', type: 'keyword', detail: 'player-chosen synonym' },
];

const KEYWORD_COMPLETIONS: Completion[] = [
  { label: 'if ', type: 'keyword', detail: 'conditional branch' },
  { label: 'elif ', type: 'keyword', detail: 'else-if branch' },
  { label: 'else', type: 'keyword', detail: 'fallback branch' },
  { label: '/if', type: 'keyword', detail: 'close conditional' },
];

const variableCompletions = (ctx: TemplateLintContext): Completion[] =>
  ctx.variables.map((name) => ({ label: name, type: 'variable' }));

const termCompletions = (ctx: TemplateLintContext): Completion[] =>
  ctx.terms.map((key) => ({ label: key, type: 'constant', detail: 'term' }));

const macroCompletions = (
  ctx: TemplateLintContext,
  withAt: boolean,
): Completion[] =>
  ctx.macros.map((m) => ({
    label: `${withAt ? '@' : ''}${m.name}`,
    type: 'function',
    detail:
      m.params.length > 0
        ? `(${m.params.map((p) => p.name).join(', ')})`
        : 'macro',
  }));

/**
 * Context-aware completions for the template mini-language, driven by the same
 * `TemplateLintContext` the linter uses. Only fires inside an open `{…}` tag,
 * and narrows suggestions by position: `{@…}` → macro names, `{word:…}` → term
 * keys, `{lower|a|cap:…}` and `{if/elif …}` conditions → variables, and a bare
 * tag start → the full menu (keywords, modifiers, macros, variables). A dotted
 * fragment whose prefix is a macro parameter (`c.…`) completes the Character's
 * fields, matching the linter's `<param>.<field>` rule.
 */
function templateCompletionSource(
  getCtx: () => TemplateLintContext,
): (context: CompletionContext) => CompletionResult | null {
  return (context) => {
    const upto = context.state.sliceDoc(0, context.pos);
    const open = upto.lastIndexOf('{');
    // Not inside an open tag if there's no `{`, or a `}` closes the last one.
    if (open === -1 || upto.lastIndexOf('}') > open) return null;
    const seg = upto.slice(open + 1);
    // Bail if a tag spans onto this position illegally (newline-free tags only).
    if (seg.includes('}')) return null;

    const ctx = getCtx();
    const localParams = new Set((ctx.localParams ?? []).map((p) => p.name));
    const result = (
      fragment: string,
      options: Completion[],
    ): CompletionResult => ({
      from: context.pos - fragment.length,
      options,
      validFor: /^[\w.]*$/,
    });

    // A variable-position fragment: if it reads `<param>.<field>` and `<param>`
    // is a Character parameter in scope, offer that entity's fields; otherwise
    // offer the surface's plain variable list (which itself already holds any
    // `prefix.field` names on entity-aware surfaces like scenes).
    const characterFields = [
      ...ENTITY_FIELD_NAMES,
      ...(ctx.appearanceFeatures ?? []),
    ];
    const variableResult = (fragment: string): CompletionResult => {
      const dot = fragment.lastIndexOf('.');
      if (dot > 0 && localParams.has(fragment.slice(0, dot))) {
        return {
          from: context.pos - (fragment.length - dot - 1),
          options: characterFields.map((f) => ({ label: f, type: 'property' })),
          validFor: /^\w*$/,
        };
      }
      return result(fragment, variableCompletions(ctx));
    };

    let m: RegExpExecArray | null;
    // {@macroName
    if ((m = /^\s*@([\w]*)$/.exec(seg))) {
      return result(m[1], macroCompletions(ctx, false));
    }
    // {word:termKey
    if ((m = /^\s*word:([\w]*)$/.exec(seg))) {
      return result(m[1], termCompletions(ctx));
    }
    // {lower:var · {a:var · {cap:var
    if ((m = /^\s*(?:lower|a|cap):([\w.]*)$/.exec(seg))) {
      return variableResult(m[1]);
    }
    // {if VAR … · {elif VAR … — complete the trailing identifier as a variable.
    if (/^\s*(?:if|elif)\s/.test(seg)) {
      return variableResult(/([\w.]*)$/.exec(seg)?.[1] ?? '');
    }
    // Bare tag start: only word chars typed so far.
    if ((m = /^\s*([\w.]*)$/.exec(seg))) {
      const word = m[1];
      // A dotted bare token (`c.age`) is a variable reference, not a tag start.
      if (word.includes('.')) return variableResult(word);
      // Don't pop up unprompted on an empty tag unless explicitly invoked.
      if (!context.explicit && word === '') return null;
      return result(word, [
        ...KEYWORD_COMPLETIONS,
        ...MODIFIER_COMPLETIONS,
        ...macroCompletions(ctx, true),
        ...variableCompletions(ctx),
      ]);
    }
    return null;
  };
}

/** CodeMirror linter backed by the pure `lintTemplate` validator. */
function templateLinter(getCtx: () => TemplateLintContext): Extension {
  return linter((view) => {
    const text = view.state.doc.toString();
    return lintTemplate(text, getCtx()).map(
      (issue): Diagnostic => ({
        from: issue.from,
        to: issue.to,
        severity: issue.severity,
        message: issue.message,
      }),
    );
  });
}

/** Highlighting + diagnostics extensions for the template language. */
export function templateExtensions(
  getCtx: () => TemplateLintContext,
): Extension[] {
  return [
    templateLanguage,
    syntaxHighlighting(highlightStyle),
    templateLinter(getCtx),
    autocompletion({ override: [templateCompletionSource(getCtx)] }),
  ];
}
