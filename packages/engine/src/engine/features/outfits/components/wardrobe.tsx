import { ActionButton } from '@sim/engine/components/action-button';
import { Badge } from '@sim/engine/components/ui/badge';
import { Card } from '@sim/engine/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@sim/engine/components/ui/tabs';
import { selectClothingState } from '@sim/engine/features/clothing/selectors';
import { evaluateFit } from '@sim/engine/features/outfits/lib/fit';
import {
  getCategories,
  getEstimatedMetrics,
  getSizeSystems,
  getSlotCategoryMap,
} from '@sim/engine/features/outfits/lib/wearable-config';
import {
  selectEquipment,
  selectWearables,
} from '@sim/engine/features/player/selectors';
import { useEngineSelector } from '@sim/engine/state/store';
import type { BodyAttributes } from '@sim/engine/types';

import RemoveEquipment from './remove-equipment';

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function Wardrobe() {
  const equipment = useEngineSelector(selectEquipment);
  const wearables = useEngineSelector(selectWearables);
  const clothing = useEngineSelector(selectClothingState);
  const body = useEngineSelector((s) => s.present.player.body) as
    | BodyAttributes
    | undefined;
  const gender = useEngineSelector(
    (s) => s.present.player.profile.appearance.gender,
  );
  const fitConfig = {
    sizeSystems: getSizeSystems(),
    estimatedMetrics: getEstimatedMetrics(),
  };

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">Wardrobe</h2>
      <Tabs defaultValue={getCategories()[0]}>
        <TabsList>
          {getCategories().map((c) => (
            <TabsTrigger value={c} key={c}>
              {c}
            </TabsTrigger>
          ))}
        </TabsList>
        {getCategories().map((c) => (
          <TabsContent value={c} key={c}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {wearables
                .filter((w) => getSlotCategoryMap()[w.slot] === c)
                .map((w) => {
                  const fit =
                    w.sizeSystem && body
                      ? evaluateFit(w, body, gender, fitConfig)
                      : null;
                  const misfit = fit && !fit.sizeless && fit.totalMismatch > 0;
                  return (
                    <Card
                      key={w.instanceId}
                      className="flex flex-col items-center justify-between gap-2 p-3"
                    >
                      <span className="text-sm font-medium">{w.name}</span>
                      <div className="flex gap-1 flex-wrap justify-center">
                        {w.size && (
                          <Badge className="bg-zinc-700/60 text-zinc-200 text-xs">
                            {w.size}
                          </Badge>
                        )}
                        {misfit && (
                          <Badge className="bg-red-900/60 text-red-300 text-xs">
                            {capitalize(fit.descriptor)}
                          </Badge>
                        )}
                        {w.instanceId && clothing[w.instanceId]?.isWet && (
                          <Badge className="bg-blue-900/60 text-blue-300 text-xs">
                            Wet
                          </Badge>
                        )}
                        {w.instanceId && clothing[w.instanceId]?.isDirty && (
                          <Badge className="bg-amber-900/60 text-amber-300 text-xs">
                            Dirty
                          </Badge>
                        )}
                      </div>
                      {equipment[w.slot]?.instanceId !== w.instanceId ? (
                        <ActionButton
                          effects={[
                            {
                              kind: 'equip',
                              operation: 'don',
                              wearable: w,
                            },
                          ]}
                        >
                          Wear
                        </ActionButton>
                      ) : (
                        <ActionButton
                          effects={[
                            {
                              kind: 'equip',
                              operation: 'doff',
                              wearable: w,
                            },
                          ]}
                        >
                          Remove
                        </ActionButton>
                      )}
                    </Card>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <RemoveEquipment />
    </>
  );
}
