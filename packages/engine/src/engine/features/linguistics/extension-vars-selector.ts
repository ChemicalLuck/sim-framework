import { createSelector } from '@reduxjs/toolkit';
import { shallowEqual } from 'react-redux';
import { templateVarProviders } from 'virtual:game-extensions';

import type { RootState } from '@chemicalluck/sim-engine/state/store';

import { collectExtensionVars } from './lib/extension-vars';

/**
 * Template variables contributed by game extensions' `template-vars.ts`,
 * namespaced as `<extension>.<key>`. Recomputed when the state changes, but
 * keeps its previous reference while the values are unchanged.
 */
export const selectExtensionTemplateVars = createSelector(
  [(state: RootState) => state],
  (state) => collectExtensionVars(templateVarProviders, state),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);
