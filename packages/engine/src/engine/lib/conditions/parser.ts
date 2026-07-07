import { conditionParsers, exprKinds, exprParsers } from 'virtual:conditions';
import type { ComparisonCondition, Condition, Expr } from '@sim/engine/types';

import { type Token, tokenize } from './tokenizer';

interface ParserState {
  pos: number;
}

function peek(tokens: Token[], cursor: ParserState): Token | undefined {
  return tokens[cursor.pos];
}

function match(
  tokens: Token[],
  cursor: ParserState,
  type: Token['type'],
  value?: string,
): boolean {
  const t = tokens[cursor.pos];
  if (t === undefined) return false; // eslint-disable-line
  if (t.type !== type) return false;
  if (value !== undefined) {
    if (
      t.type === 'identifier' ||
      t.type === 'operator' ||
      t.type === 'string'
    ) {
      if ((t as { value: string }).value !== value) return false;
    } else {
      return false;
    }
  }
  cursor.pos++;
  return true;
}

function expect(
  tokens: Token[],
  cursor: ParserState,
  type: Token['type'],
  value?: string,
): Token {
  const t = tokens[cursor.pos];
  if (t.type !== type) {
    throw new Error(
      `Expected token type ${type} but found ${t.type} (${JSON.stringify(t)})`,
    );
  }
  if (value !== undefined) {
    if (
      t.type === 'identifier' ||
      t.type === 'operator' ||
      t.type === 'string'
    ) {
      if ((t as { value: string }).value !== value) {
        throw new Error(
          `Expected token value '${value}' but found '${(t as { value: string }).value}'`,
        );
      }
    } else {
      throw new Error(
        `Expected token value '${value}' but token is of type ${t.type}`,
      );
    }
  }
  cursor.pos++;
  return t;
}

export const expr = {
  const: (v: number): Expr => ({ kind: 'const', value: v }),
  string: (v: string): Expr => ({ kind: 'string', value: v }),
  date: (v: string): Expr => ({ kind: 'date', value: v }),
} as const;

export const cond = {
  lt: (lhs: Expr, rhs: Expr): ComparisonCondition => ({ kind: 'lt', lhs, rhs }),
  lte: (lhs: Expr, rhs: Expr): ComparisonCondition => ({
    kind: 'lte',
    lhs,
    rhs,
  }),
  eq: (lhs: Expr, rhs: Expr): ComparisonCondition => ({ kind: 'eq', lhs, rhs }),
  neq: (lhs: Expr, rhs: Expr): ComparisonCondition => ({
    kind: 'neq',
    lhs,
    rhs,
  }),
  gt: (lhs: Expr, rhs: Expr): ComparisonCondition => ({ kind: 'gt', lhs, rhs }),
  gte: (lhs: Expr, rhs: Expr): ComparisonCondition => ({
    kind: 'gte',
    lhs,
    rhs,
  }),

  and: (
    lhs: Condition | undefined,
    rhs: Condition | undefined,
  ): Condition | undefined => {
    if (!lhs) return rhs;
    if (!rhs) return lhs;
    return { kind: 'and', lhs, rhs };
  },

  or: (
    lhs: Condition | undefined,
    rhs: Condition | undefined,
  ): Condition | undefined => {
    if (!lhs) return rhs;
    if (!rhs) return lhs;
    return { kind: 'or', lhs, rhs };
  },
} as const;

export function parseCondition(input: string): Condition {
  const tokens = tokenize(input);
  const state: ParserState = { pos: 0 };
  const result = parseOr(tokens, state);

  if (state.pos < tokens.length) {
    throw new Error(
      `Unexpected token after condition at position ${state.pos.toString()}: ${JSON.stringify(tokens[state.pos])}`,
    );
  }

  return result;
}

/* OR -> AND ( '||' AND )* */
function parseOr(tokens: Token[], s: ParserState): Condition {
  let left = parseAnd(tokens, s);
  while (match(tokens, s, 'operator', '||')) {
    const right = parseAnd(tokens, s);
    left = { kind: 'or', lhs: left, rhs: right };
  }
  return left;
}

/* AND -> COMPARISON ( '&&' COMPARISON )* */
function parseAnd(tokens: Token[], s: ParserState): Condition {
  let left = parseComparison(tokens, s);
  while (match(tokens, s, 'operator', '&&')) {
    const right = parseComparison(tokens, s);
    left = { kind: 'and', lhs: left, rhs: right };
  }
  return left;
}

function parseComparison(tokens: Token[], s: ParserState): Condition {
  const leftOperand = parseOperand(tokens, s);

  if (isConditionNode(leftOperand)) {
    return leftOperand;
  }

  const next = peek(tokens, s);
  if (next?.type !== 'operator') {
    throw new Error('Expected comparison operator after expression');
  }

  const opTok = expect(tokens, s, 'operator') as {
    type: 'operator';
    value: string;
  };
  const rawOp = opTok.value === '=' ? '==' : opTok.value;
  const valid = ['<', '<=', '==', '!=', '>', '>='].includes(rawOp);
  if (!valid) {
    throw new Error(`Invalid comparison operator '${opTok.value}'`);
  }

  const rightOperand = parseOperand(tokens, s);
  if (isConditionNode(rightOperand)) {
    throw new Error(
      'Right-hand side of comparison must be a value expression, not a boolean condition',
    );
  }

  switch (rawOp) {
    case '<':
      return cond.lt(leftOperand, rightOperand);
    case '<=':
      return cond.lte(leftOperand, rightOperand);
    case '==':
      return cond.eq(leftOperand, rightOperand);
    case '!=':
      return cond.neq(leftOperand, rightOperand);
    case '>':
      return cond.gt(leftOperand, rightOperand);
    case '>=':
      return cond.gte(leftOperand, rightOperand);
    default:
      throw new Error(`Unhandled comparator ${rawOp}`);
  }
}

function parseOperand(tokens: Token[], s: ParserState): Expr | Condition {
  const tok = peek(tokens, s);
  if (!tok) throw new Error('Unexpected end of input while parsing operand');

  if (match(tokens, s, 'lparen')) {
    const inner = parseOr(tokens, s);
    expect(tokens, s, 'rparen');
    return inner;
  }

  if (tok.type === 'number') {
    expect(tokens, s, 'number');
    return expr.const(tok.value);
  }

  if (tok.type === 'string') {
    expect(tokens, s, 'string');
    const iso = Date.parse(tok.value);
    if (!Number.isNaN(iso)) {
      return expr.date(tok.value);
    }
    return expr.string(tok.value);
  }

  if (tok.type === 'identifier') {
    expect(tokens, s, 'identifier');
    return parseIdentifierAsExpr(tok.value);
  }

  throw new Error(`Unexpected token in operand: ${JSON.stringify(tok)}`);
}

function parseIdentifierAsExpr(id: string): Expr | Condition {
  for (const parse of exprParsers) {
    const result = parse(id);
    if (result !== null) return result;
  }

  for (const parse of conditionParsers) {
    const result = parse(id);
    if (result !== null) return result;
  }

  return expr.string(id);
}

const CORE_EXPR_KINDS = new Set(['const', 'string', 'date']);

function isExprNode(node: Expr | Condition): node is Expr {
  return CORE_EXPR_KINDS.has(node.kind) || exprKinds.has(node.kind);
}

function isConditionNode(node: Expr | Condition): node is Condition {
  return !isExprNode(node);
}

export function parseConditionSafe(input: string): Condition {
  try {
    return parseCondition(input);
  } catch (err) {
    throw new Error(
      `Failed to parse condition "${input}": ${(err as Error).message}`,
    );
  }
}
