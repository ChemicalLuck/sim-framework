import { GlobalLogger } from '@chemicalluck/engine/lib/logger';

export function measureTime<T>(fn: () => T): { result: T; ms: number } {
  const start = performance.now();
  const result = fn();
  const ms = performance.now() - start;
  return { result, ms };
}

const logger = GlobalLogger.child('perf');

export function logTimed<T>(label: string, fn: () => T): T {
  const { result, ms } = measureTime(fn);
  logger.debug(`${label} took ${ms.toFixed(2)}ms`);
  return result;
}
