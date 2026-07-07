# Condition System

Conditions gate whether a scene action is shown or enabled. They are written as string expressions in game data and evaluated at runtime against Redux state.

## Pipeline

```
string expression
  └─ tokenize()   → Token[]
       └─ parseCondition()  → Condition AST
            └─ isConditionMet(state, cond)  → boolean
```

All three phases are extensible. Features and extensions can add new expression variable kinds and new condition kinds without modifying this directory.

## DSL Syntax

```
# Comparison (lhs op rhs)
money.balance >= 50
player.locationId == 'campus_library'
time.hour < 18

# Boolean operators (left-to-right, && binds tighter than ||)
money.balance >= 50 && time.hour < 20
quest.stage == 'complete' || milestone.freshman_week

# Grouping
(money.balance >= 10 || has_dirty_clothes) && time.hour > 8

# String literals (single or double quotes)
player.locationId == "campus_cafe"

# Numeric literals
needs.energy > 0.25

# Date literals (ISO 8601 strings are parsed automatically)
time.date >= '2025-09-01'
```

**Comparison operators:** `<`, `<=`, `==`, `!=`, `>`, `>=`  
**Boolean operators:** `&&`, `||`  
**Identifiers:** dot-separated (e.g. `money.balance`, `needs.hunger`)

## Built-In Types

**Expr kinds** (value expressions):

- `const` — numeric literal
- `string` — string literal
- `date` — ISO date string (compared as timestamp)

**Condition kinds:**

- `and`, `or` — compound boolean
- `not` — negation (not parseable from string DSL; construct via `cond` builders in TypeScript)
- `lt`, `lte`, `eq`, `neq`, `gt`, `gte` — comparison

## Extension Points

Features add new `Expr` kinds (variable lookups) via module augmentation:

```ts
// In feature's types.ts or conditions.ts:
declare module '~/engine/types/condition.types' {
  interface ExprMap {
    money_balance: MoneyBalanceExpr;
  }
}
```

Then register a parser and evaluator via `virtual:conditions` (declared in `feature.json`).

Features add new condition kinds via `ConditionMap` augmentation and a corresponding evaluator.

## Public API

```ts
import {
  isConditionMet,
  parseCondition,
  parseConditionSafe,
} from '~/engine/lib/conditions';
import { evalExpr } from '~/engine/lib/conditions';
// TypeScript-only builders (no string parsing):
import { cond, expr } from '~/engine/lib/conditions/parser';

parseCondition('money.balance >= 50'); // throws on syntax error
parseConditionSafe('...'); // wraps error with input context
isConditionMet(state, condition); // evaluates against Redux state
```
