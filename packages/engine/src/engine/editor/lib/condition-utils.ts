import { conditionSerializers, exprSerializers } from 'virtual:conditions';
import type {
  ComparisonCondition,
  Condition,
  Expr,
} from '@chemicalluck/engine/types/condition.types';

function serializeExpr(e: Expr): string {
  switch (e.kind) {
    case 'const':
      return String(e.value);
    case 'string':
      return `'${e.value}'`;
    case 'date':
      return `'${e.value}'`;
    default: {
      const serializer = exprSerializers[e.kind];
      if (serializer) return serializer(e);
      throw new Error(`Failed to serialize unknown expression kind: ${e.kind}`);
    }
  }
}

const OP: Record<ComparisonCondition['kind'], string> = {
  lt: '<',
  lte: '<=',
  eq: '==',
  neq: '!=',
  gt: '>',
  gte: '>=',
};

export function conditionToString(c: Condition): string {
  switch (c.kind) {
    case 'lt':
    case 'lte':
    case 'eq':
    case 'neq':
    case 'gt':
    case 'gte':
      return `${serializeExpr(c.lhs)} ${OP[c.kind]} ${serializeExpr(c.rhs)}`;
    case 'and':
      return `(${conditionToString(c.lhs)}) && (${conditionToString(c.rhs)})`;
    case 'or':
      return `(${conditionToString(c.lhs)}) || (${conditionToString(c.rhs)})`;
    case 'not':
      return `!(${conditionToString(c.operand)})`;
    default: {
      const serializer = conditionSerializers[c.kind];
      if (serializer) return serializer(c);
      throw new Error(`Failed to serialize unknown condition kind: ${c.kind}`);
    }
  }
}
