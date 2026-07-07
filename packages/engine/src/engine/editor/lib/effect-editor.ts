import { type ComponentType, createContext, use } from 'react';
import type { Effect } from '@chemicalluck/sim-engine/types/effect.types';

export type AvailableData = Record<string, unknown>;

export interface DataRequirement {
  key: string;
  extract?: (raw: unknown) => unknown;
}

export interface EffectEditorFieldsProps<S> {
  value: S;
  onChange: (patch: Partial<S>) => void;
  availableData: AvailableData | undefined;
}

export interface EffectEditorModule<S = unknown> {
  /** Effect.kind discriminator this module owns. */
  kind: string;
  /** Chip color class string. */
  color: string;
  /** Compact label rendered inside the chip. */
  label: (effect: Effect) => string;
  /** Initial form state when adding a fresh effect. */
  defaultState: S;
  /** Hydrate form state from an existing effect (edit mode). */
  toFormState: (effect: Effect) => S;
  /** Build an Effect from form state. Return null if incomplete/invalid. */
  buildEffect: (state: S) => Effect | null;
  /** Per-kind form fields. */
  Fields: ComponentType<EffectEditorFieldsProps<S>>;
  /** Hide from the kind picker (e.g. `equip`). */
  hidden?: boolean;
}

/**
 * Describes a view-kind effect sub-type contributed by an engine feature.
 * Export an array of these as `viewSections` from a feature's effect-editor
 * file to have the view effect-editor pick them up automatically.
 */
export interface ViewSectionSpec {
  viewId: string;
  getLabel(raw: Record<string, unknown>): string | null;
  getValues(raw: Record<string, unknown>): Record<string, string>;
  buildEffect(values: Record<string, string>): Effect | null;
  Fields: ComponentType<{
    values: Record<string, string>;
    onChange: (patch: Record<string, string>) => void;
    availableData: AvailableData | undefined;
  }>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface EffectEditorMap {}

export function defineEffectEditor<S>(
  mod: EffectEditorModule<S>,
): EffectEditorModule<S> {
  return mod;
}

export const EffectEditorsContext = createContext<
  Record<string, EffectEditorModule>
>({});

export function useEffectEditors(): Record<string, EffectEditorModule> {
  return use(EffectEditorsContext);
}
