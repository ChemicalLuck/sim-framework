/**
 * Features and extensions augment this interface to register their Expr types.
 * Each key is the Expr's `kind` discriminator.
 *
 * @example
 * declare module '@chemicalluck/sim-engine/types/condition.types' {
 *   interface ExprMap {
 *     my_expr: MyExpr;
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExprMap {}

export type ExtensionExpr = ExprMap[keyof ExprMap];

export type Expr =
  | { kind: 'const'; value: number }
  | { kind: 'string'; value: string }
  | { kind: 'date'; value: string }
  | ([ExtensionExpr] extends [never] ? never : ExtensionExpr);

export interface ComparisonCondition {
  kind: 'lt' | 'lte' | 'eq' | 'neq' | 'gt' | 'gte';
  lhs: Expr;
  rhs: Expr;
}

export interface CompoundCondition {
  kind: 'and' | 'or';
  lhs: Condition;
  rhs: Condition;
}

export interface NotCondition {
  kind: 'not';
  operand: Condition;
}

/**
 * Features and extensions augment this interface to register their condition types.
 * Each key is the condition's `kind` discriminator.
 *
 * @example
 * declare module '@chemicalluck/sim-engine/types/condition.types' {
 *   interface ConditionMap {
 *     my_condition: MyCondition;
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConditionMap {}

export type ExtensionCondition = ConditionMap[keyof ConditionMap];

export type Condition =
  | ComparisonCondition
  | CompoundCondition
  | NotCondition
  | ([ExtensionCondition] extends [never] ? never : ExtensionCondition);
