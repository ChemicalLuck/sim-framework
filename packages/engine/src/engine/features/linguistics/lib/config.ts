import type { LinguisticsJsonData, LinguisticsTerm } from '../types';
import { type CompiledMacro, parseTemplate } from './template';

let _macros = new Map<string, CompiledMacro>();
let _terms = new Map<string, LinguisticsTerm>();

/** Pre-parse macro templates and index terms by key. Loaded from `linguistics.json` at setup. */
export function configureLinguistics(data: LinguisticsJsonData): void {
  _macros = new Map(
    data.macros.map((m) => [
      m.name,
      { params: m.params ?? [], body: parseTemplate(m.template) },
    ]),
  );
  _terms = new Map(data.terms.map((t) => [t.key, t]));
}

export function getMacros(): ReadonlyMap<string, CompiledMacro> {
  return _macros;
}

export function getTerms(): ReadonlyMap<string, LinguisticsTerm> {
  return _terms;
}
