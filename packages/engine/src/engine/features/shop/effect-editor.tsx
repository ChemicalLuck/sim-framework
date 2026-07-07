import { IdSelect } from '@chemicalluck/sim-engine/editor/components/effect-form-primitives';
import {
  type DataRequirement,
  type ViewSectionSpec,
} from '@chemicalluck/sim-engine/editor/lib/effect-editor';
import type { Effect } from '@chemicalluck/sim-engine/types/effect.types';

export const viewSections: ViewSectionSpec[] = [
  {
    viewId: 'ShopView',

    getLabel(raw) {
      const shopId = raw.shopId;
      return typeof shopId === 'string' && shopId ? `→shop:${shopId}` : null;
    },

    getValues(raw) {
      return { shopId: typeof raw.shopId === 'string' ? raw.shopId : '' };
    },

    buildEffect({ shopId }) {
      if (!shopId.trim()) return null;
      return {
        kind: 'view',
        activeViewId: 'ShopView',
        shopId: shopId.trim(),
      } as unknown as Effect;
    },

    Fields({ values, onChange, availableData }) {
      return (
        <IdSelect
          label="Shop ID"
          value={values.shopId}
          onChange={(v) => {
            onChange({ shopId: v });
          }}
          options={(availableData?.shops as string[] | undefined) ?? []}
          placeholder="pharmacy"
        />
      );
    },
  },
];

export const editorDataRequirements: DataRequirement[] = [{ key: 'shops' }];

export default {};
