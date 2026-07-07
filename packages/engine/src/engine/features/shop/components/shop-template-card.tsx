import { useState } from 'react';
import { ActionButton } from '@chemicalluck/sim-engine/components/action-button';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@chemicalluck/sim-engine/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@chemicalluck/sim-engine/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@chemicalluck/sim-engine/components/ui/select';
import { formatMoney } from '@chemicalluck/sim-engine/features/money/lib/currency';
import { formatSize, idealSizeLabels } from '@chemicalluck/sim-engine/features/outfits/lib/fit';
import {
  getAppearanceKeys,
  getEstimatedMetrics,
  getSizeSystems,
} from '@chemicalluck/sim-engine/features/outfits/lib/wearable-config';
import { generateWearableFromTemplate } from '@chemicalluck/sim-engine/features/outfits/lib/wearables';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';
import type {
  WearableAppearance,
  WearableAppearanceKey,
  WearableTemplate,
} from '@chemicalluck/sim-engine/types/item.types';

interface ShopTemplateCardProps {
  template: WearableTemplate;
}

export default function ShopTemplateCard({ template }: ShopTemplateCardProps) {
  const [selectedAppearance, setSelectedAppearance] =
    useState<WearableAppearance>(() => {
      const initial: WearableAppearance = {};
      for (const key of getAppearanceKeys()) {
        initial[key] = template.options[key]?.[0] ?? '';
      }
      return initial;
    });

  const handleChange = (key: WearableAppearanceKey, value: string) => {
    const updated = { ...selectedAppearance, [key]: value };
    setSelectedAppearance(updated);
  };

  const body = useEngineSelector((s) => s.present.player.body);
  const gender = useEngineSelector(
    (s) => s.present.player.profile.appearance.gender,
  );
  const system = template.sizeSystem
    ? getSizeSystems()[template.sizeSystem]
    : undefined;

  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>(
    () =>
      system
        ? idealSizeLabels(system, body, gender, {
            sizeSystems: getSizeSystems(),
            estimatedMetrics: getEstimatedMetrics(),
          })
        : {},
  );

  const composedSize = system ? formatSize(system, selectedSizes) : undefined;

  return (
    <Card className="gap-2 py-4 justify-between">
      <CardHeader>
        <CardTitle className="text-md font-bold">{template.name}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm flex flex-col gap-1">
        <span className="text-muted-foreground">
          Price: {formatMoney(template.value)}
        </span>
      </CardContent>
      <Dialog>
        <CardFooter className="px-3 justify-center">
          <DialogTrigger asChild>
            <Button variant="outline">Customize & Buy</Button>
          </DialogTrigger>
        </CardFooter>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Customize {template.name}</DialogTitle>
            <DialogDescription>
              Pick your preferred material, color, pattern, and style before
              purchasing.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 flex gap-2 flex-col">
            {getAppearanceKeys().map((key) => {
              const options = template.options[key];
              if (!options || options.length === 0) return null;

              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-24 text-sm font-medium capitalize">
                    {key}
                  </span>
                  <Select
                    defaultValue={options[0]}
                    onValueChange={(value) => {
                      handleChange(key, value);
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={`Select ${key}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
            {system?.dimensions.map((dimension) => (
              <div key={dimension.name} className="flex items-center gap-2">
                <span className="w-24 text-sm font-medium capitalize">
                  {dimension.name}
                </span>
                <Select
                  value={selectedSizes[dimension.name] ?? ''}
                  onValueChange={(value) => {
                    setSelectedSizes((prev) => ({
                      ...prev,
                      [dimension.name]: value,
                    }));
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={`Select ${dimension.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {dimension.sizes.map((tier) => (
                      <SelectItem key={tier.label} value={tier.label}>
                        {tier.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <DialogFooter className="flex justify-center">
            <ActionButton
              effects={[
                {
                  kind: 'purchase',
                  item: generateWearableFromTemplate(
                    template,
                    selectedAppearance,
                    composedSize,
                  ),
                  cost: template.value,
                },
              ]}
              disabled={Object.keys(selectedAppearance).length === 0}
            >
              Buy{system ? ` (${composedSize ?? ''})` : ''} for{' '}
              {formatMoney(template.value)}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
