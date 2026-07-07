import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@sim/engine/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@sim/engine/components/ui/form';
import { Input } from '@sim/engine/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sim/engine/components/ui/select';
import WithCentered from '@sim/engine/components/with-centered';
import {
  getAppearanceLists,
  getBodyAttributes,
  isBodyAttributeVisible,
} from '@sim/engine/features/npcs/lib/appearance-config';
import {
  estimatePlayerSizes,
  idealSizeIndex,
} from '@sim/engine/features/outfits/lib/fit';
import {
  type SizeSystem,
  type SizeTier,
  getEstimatedMetrics,
  getSizeSystems,
} from '@sim/engine/features/outfits/lib/wearable-config';
import { getPostCharacterCreationView } from '@sim/engine/features/player/lib/character-customisation';
import {
  getCharacterCreationSkillPoints,
  getSkills,
} from '@sim/engine/features/player/lib/skills';
import {
  setBody,
  setProfile,
  updateSkill,
} from '@sim/engine/features/player/slice';
import { type ViewState, setView } from '@sim/engine/features/view/slice';
import { appName } from '@sim/engine/lib/core';
import { useEngineDispatch, useEngineSelector } from '@sim/engine/state/store';
import type {
  BodyAttributes,
  CharacterProfile,
  CharacterProfileTemplate,
} from '@sim/engine/types';

function isFeatureVisible(
  feat: { showWhen?: { featureId: string; values: string[] } },
  watched: Record<string, string | null>,
): boolean {
  if (!feat.showWhen) return true;
  const current = watched[feat.showWhen.featureId] ?? null;
  return current !== null && feat.showWhen.values.includes(current);
}

function SectionHeading({ children }: React.PropsWithChildren) {
  return (
    <h3 className="col-span-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-1 mt-2">
      {children}
    </h3>
  );
}

function SelectField({
  label,
  placeholder,
  options,
  field,
}: {
  label: string;
  placeholder: string;
  options: readonly string[];
  field: { onChange: (v: string) => void; value: string | null };
}) {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <Select onValueChange={field.onChange} value={field.value ?? ''}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  );
}

const MAX_SKILL_AT_CREATION = 3;

export function CharacterCustomisationView() {
  const appearanceFeatures = getAppearanceLists();

  const defaultAppearance: Record<string, string | null> = Object.fromEntries(
    appearanceFeatures.map((f) => [f.id, null]),
  );

  const form = useForm<CharacterProfileTemplate>({
    defaultValues: {
      firstName: '',
      lastName: '',
      profession: 'Student',
      age: 18,
      appearance: defaultAppearance,
    },
  });
  const watchedAppearance = form.watch('appearance');
  const dispatch = useEngineDispatch();
  const skills = getSkills();
  const budget = getCharacterCreationSkillPoints();
  const [skillAlloc, setSkillAlloc] = useState<Record<string, number>>(() =>
    Object.fromEntries(skills.map((s) => [s.id, 0])),
  );

  const storeBody = useEngineSelector((s) => s.present.player.body);
  const [body, setBodyState] = useState<BodyAttributes>(() => ({
    ...storeBody,
  }));

  const gender = watchedAppearance.gender ?? undefined;
  const sizeSystems = getSizeSystems();
  const estimatedMetrics = getEstimatedMetrics();
  const sizePreview = estimatePlayerSizes(body, gender, {
    sizeSystems,
    estimatedMetrics,
  });

  function setBodyField(key: string, value: number) {
    setBodyState((prev) => ({ ...prev, [key]: value }));
  }

  const watchedAppearanceNonNull: Record<string, string> = Object.fromEntries(
    Object.entries(watchedAppearance).filter(
      (e): e is [string, string] => e[1] !== null,
    ),
  );
  const visibleBodyAttrs = getBodyAttributes().filter((a) =>
    isBodyAttributeVisible(a, watchedAppearanceNonNull),
  );

  // Cup size (bust − underbust) is chosen directly. Derive the options and the
  // stored cm value from the configured bra system's cup dimension.
  const braSystem = sizeSystems.bra as SizeSystem | undefined;
  const cupDimension = braSystem?.dimensions.find(
    (d) => d.metric === 'bustDifference',
  );
  const cupValueForIndex = (sizes: SizeTier[], idx: number): number => {
    const lower = idx === 0 ? 0 : sizes[idx - 1].max;
    const upper = sizes[idx].max;
    return idx === sizes.length - 1 ? lower + 2 : (lower + upper) / 2;
  };
  const selectedCup = cupDimension
    ? cupDimension.sizes[idealSizeIndex(body.bustDifference, cupDimension)]
        .label
    : null;
  const handleCupChange = (label: string): void => {
    if (!cupDimension) return;
    const idx = cupDimension.sizes.findIndex((t) => t.label === label);
    if (idx >= 0)
      setBodyField('bustDifference', cupValueForIndex(cupDimension.sizes, idx));
  };

  const spent = Object.values(skillAlloc).reduce((a, b) => a + b, 0);
  const remaining = budget - spent;

  function adjustSkill(id: string, delta: number) {
    setSkillAlloc((prev) => {
      const current = prev[id] ?? 0;
      const next = Math.max(
        0,
        Math.min(MAX_SKILL_AT_CREATION, current + delta),
      );
      if (delta > 0 && remaining <= 0) return prev;
      return { ...prev, [id]: next };
    });
  }

  const onSubmit = (data: CharacterProfileTemplate): void => {
    const visibleIds = new Set(
      appearanceFeatures
        .filter((feat) => isFeatureVisible(feat, watchedAppearance))
        .map((f) => f.id),
    );
    const appearance: Record<string, string> = Object.fromEntries(
      Object.entries(data.appearance).filter(
        (entry): entry is [string, string] =>
          entry[1] !== null && visibleIds.has(entry[0]),
      ),
    );
    dispatch(setProfile({ ...data, appearance } as CharacterProfile));
    dispatch(setBody(body));
    for (const [skill, value] of Object.entries(skillAlloc)) {
      if (value > 0) dispatch(updateSkill({ skill, value }));
    }
    dispatch(
      setView({
        activeViewId: getPostCharacterCreationView(),
        props: {},
      } as ViewState),
    );
  };

  return (
    <WithCentered>
      <h1 className="text-3xl font-bold tracking-tight">{appName}</h1>
      <h2 className="text-base text-muted-foreground">Create Character</h2>

      <Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className="grid grid-cols-2 gap-x-6 gap-y-3 max-w-2xl mx-auto text-left"
        >
          <SectionHeading>Identity</SectionHeading>

          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <SectionHeading>Appearance</SectionHeading>
          {appearanceFeatures
            .filter((feat) => isFeatureVisible(feat, watchedAppearance))
            .map((feat) => (
              <FormField
                key={feat.id}
                control={form.control}
                name={`appearance.${feat.id}` as keyof CharacterProfileTemplate}
                render={({ field }) => (
                  <SelectField
                    label={feat.label}
                    placeholder={`Select ${feat.label}`}
                    options={feat.values}
                    field={
                      field as {
                        onChange: (v: string) => void;
                        value: string | null;
                      }
                    }
                  />
                )}
              />
            ))}

          <SectionHeading>Body</SectionHeading>

          {visibleBodyAttrs
            .filter((a) => a.id !== 'bustDifference')
            .map((a) => (
              <FormItem key={a.id}>
                <FormLabel>
                  {a.label} ({a.unit})
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={a.distribution.default.min}
                    max={a.distribution.default.max}
                    value={body[a.id] ?? a.default}
                    onChange={(e) => {
                      setBodyField(a.id, Number(e.target.value));
                    }}
                  />
                </FormControl>
              </FormItem>
            ))}

          {visibleBodyAttrs.some((a) => a.id === 'bustDifference') &&
            cupDimension && (
              <SelectField
                label="Cup"
                placeholder="Select cup"
                options={cupDimension.sizes.map((t) => t.label)}
                field={{ onChange: handleCupChange, value: selectedCup }}
              />
            )}

          {sizePreview.length > 0 && (
            <p className="col-span-2 text-xs text-muted-foreground">
              Estimated sizes:{' '}
              {sizePreview.map((p) => `${p.label} ${p.size}`).join(' · ')}
            </p>
          )}

          {skills.length > 0 && (
            <>
              <SectionHeading>
                Skills{' '}
                <span className="font-normal text-muted-foreground normal-case">
                  ({remaining} point{remaining !== 1 ? 's' : ''} remaining)
                </span>
              </SectionHeading>
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="col-span-2 flex items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">
                      {skill.name}
                    </p>
                    {skill.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {skill.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        adjustSkill(skill.id, -1);
                      }}
                      disabled={skillAlloc[skill.id] === 0}
                      className="w-6 h-6 rounded text-sm font-bold bg-secondary hover:bg-secondary/80 disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-4 text-center text-sm font-mono">
                      {skillAlloc[skill.id] ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        adjustSkill(skill.id, 1);
                      }}
                      disabled={
                        remaining <= 0 ||
                        (skillAlloc[skill.id] ?? 0) >= MAX_SKILL_AT_CREATION
                      }
                      className="w-6 h-6 rounded text-sm font-bold bg-secondary hover:bg-secondary/80 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          <div className="col-span-2 mt-2">
            <Button type="submit" className="w-full">
              Save Character
            </Button>
          </div>
        </form>
      </Form>
    </WithCentered>
  );
}
