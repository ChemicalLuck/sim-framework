import type { BodyAttributes } from '@chemicalluck/sim-engine/types/character.types';

import type { EstimatedMetric, LinearModel } from './wearable-config';

function asRecord(body: BodyAttributes): Record<string, number> {
  return body as unknown as Record<string, number>;
}

function evaluateLinear(model: LinearModel, body: BodyAttributes): number {
  let value = model.intercept;
  for (const [attr, coeff] of Object.entries(model.terms)) {
    value += (coeff ?? 0) * (asRecord(body)[attr] ?? 0);
  }
  return value;
}

/**
 * Estimate a garment measurement from the player's primary body attributes,
 * using the gender-specific model when one is configured, else the default.
 * Returns undefined when no model is configured for `name`.
 */
export function estimateMetric(
  name: string,
  body: BodyAttributes,
  gender: string | undefined,
  estimatedMetrics: Record<string, EstimatedMetric>,
): number | undefined {
  const metric = estimatedMetrics[name] as EstimatedMetric | undefined;
  if (!metric) return undefined;
  const model =
    (gender ? metric.byGender?.[gender] : undefined) ?? metric.default;
  return evaluateLinear(model, body);
}

/**
 * Resolve any size-system metric: a primary body attribute is returned
 * directly, anything else is estimated. Returns undefined when unresolvable.
 */
export function resolveMetric(
  name: string,
  body: BodyAttributes,
  gender: string | undefined,
  estimatedMetrics: Record<string, EstimatedMetric>,
): number | undefined {
  if (Object.prototype.hasOwnProperty.call(body, name)) {
    return asRecord(body)[name];
  }
  return estimateMetric(name, body, gender, estimatedMetrics);
}
