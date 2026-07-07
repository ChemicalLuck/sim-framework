import { conditionEvaluators, exprEvaluators } from 'virtual:conditions';
import { type RootState } from '@chemicalluck/sim-engine/state/store';
import type { ComparisonCondition, Condition, Expr } from '@chemicalluck/sim-engine/types';

export function evalExpr(state: RootState, expr: Expr): number | string {
  switch (expr.kind) {
    case 'const':
      return expr.value;

    case 'string':
      return expr.value;

    case 'date':
      return new Date(expr.value).getTime();

    default: {
      const handler = exprEvaluators[expr.kind];
      if (handler) return handler(expr, state);
      throw new Error(`Unknown expr kind: ${expr.kind}`);
    }
  }
}

export type ExprValue = number | string;

export function compare(
  a: ExprValue,
  b: ExprValue,
  op: ComparisonCondition['kind'],
): boolean {
  if (typeof a === 'string' || typeof b === 'string') {
    if (op === 'eq') return a === b;
    if (op === 'neq') return a !== b;
    throw new Error('Cannot perform numeric comparison on strings');
  }

  switch (op) {
    case 'lt':
      return a < b;
    case 'lte':
      return a <= b;
    case 'eq':
      return a === b;
    case 'neq':
      return a !== b;
    case 'gt':
      return a > b;
    case 'gte':
      return a >= b;
  }
}

export function isConditionMet(state: RootState, cond?: Condition): boolean {
  if (!cond) return true;

  switch (cond.kind) {
    case 'and':
      return isConditionMet(state, cond.lhs) && isConditionMet(state, cond.rhs);

    case 'or':
      return isConditionMet(state, cond.lhs) || isConditionMet(state, cond.rhs);

    case 'not':
      return !isConditionMet(state, cond.operand);

    case 'lt':
    case 'lte':
    case 'eq':
    case 'neq':
    case 'gt':
    case 'gte': {
      const left = evalExpr(state, cond.lhs);
      const right = evalExpr(state, cond.rhs);
      return compare(left, right, cond.kind);
    }

    default: {
      const handler = conditionEvaluators[cond.kind];
      if (handler) return handler(cond, state);
      throw new Error(`Unknown condition kind: ${cond.kind}`);
    }
  }
}
