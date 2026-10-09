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
money >= 50
location == 'campus_library'
gamehour < 18

# Boolean operators (left-to-right, && binds tighter than ||)
money >= 50 && gamehour < 20
skill.charm >= 3 || milestone.freshman_week

# Grouping
(money >= 10 || has_dirty_clothes) && gamehour > 8

# String literals (single or double quotes)
location == "campus_cafe"

# Numeric literals
need.Energy > 25

# Date literals (ISO 8601 strings are parsed automatically)
gametime >= '2025-09-01'

# Feature-owned comparisons
season == 'summer'
weather == 'rainy'
```

**Comparison operators:** `<`, `<=`, `==`, `!=`, `>`, `>=`
**Boolean operators:** `&&`, `||`
**Identifiers:** must be registered by a feature or extension. An unrecognised
bare identifier is a parse error — quote string literals.

Built-in identifiers:

| Identifier                                               | Kind      | Feature       |
| -------------------------------------------------------- | --------- | ------------- |
| `money`                                                  | number    | money         |
| `need.<Name>`                                            | number    | needs         |
| `npcNeed.<name>`                                         | number    | encounter     |
| `skill.<id>`                                             | number    | player        |
| `location`                                               | string    | player        |
| `gametime`, `gamehour`                                   | number    | time          |
| `relationship.<metric>`, `relationship.<npcId>.<metric>` | number    | relationships |
| `milestone.<id>`                                         | condition | milestones    |
| `container.<id>.has_items`, `container.<id>.has_dirty`   | condition | containers    |
| `has_dirty_clothes`, `has_wet_clothes`                   | condition | clothing      |
| `season == '<id>'`, `weather == '<id>'`                  | condition | weather       |

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

Then export `exprParsers`, `exprEvaluators`, `exprKinds` and `exprSerializers`
from the feature's `conditions.ts`; they are merged into `virtual:conditions`
automatically.

`comparisonParsers` (`(identifier, op, literal) => Condition | null`) let a
feature parse a whole `<identifier> <op> <literal>` comparison into its own
condition kind, e.g. `season == 'summer'`.

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

parseCondition('money >= 50'); // throws on syntax error or unknown identifier
parseConditionSafe('...'); // wraps error with input context
isConditionMet(state, condition); // evaluates against Redux state
```
