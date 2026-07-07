import { Package, User } from 'lucide-react';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@chemicalluck/sim-engine/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@chemicalluck/sim-engine/components/ui/tabs';
import {
  getBodyAttributes,
  isBodyAttributeVisible,
} from '@chemicalluck/sim-engine/features/npcs/lib/appearance-config';
import { getSkills } from '@chemicalluck/sim-engine/features/player/lib/skills';
import {
  selectAppearanceDescription,
  selectPlayerDescription,
  selectPlayerSizes,
} from '@chemicalluck/sim-engine/features/player/selectors';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

export default function CharacterDialog() {
  const profile = useEngineSelector((s) => s.present.player.profile);
  const skills = useEngineSelector((s) => s.present.player.skills);
  const items = useEngineSelector((s) => s.present.containers.player ?? []);
  const body = useEngineSelector((s) => s.present.player.body);
  const description = useEngineSelector(selectPlayerDescription);
  const sizes = useEngineSelector(selectPlayerSizes);
  const outfit = useEngineSelector(selectAppearanceDescription);
  const skillDefs = getSkills();

  const fullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    'Unnamed';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          <User className="size-4" />
          Character
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Character</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex-1">
              Profile
            </TabsTrigger>
            {skillDefs.length > 0 && (
              <TabsTrigger value="skills" className="flex-1">
                Skills
              </TabsTrigger>
            )}
            <TabsTrigger value="inventory" className="flex-1">
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 text-sm mt-4">
            <div className="space-y-0.5">
              <p className="font-medium text-base">{fullName}</p>
              <p className="text-muted-foreground text-xs">
                {[
                  profile.age ? `Age ${String(profile.age)}` : null,
                  profile.profession,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>

            {description && (
              <p className="text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}

            <div className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Physique
              </h3>
              <p className="text-muted-foreground">
                {getBodyAttributes()
                  .filter(
                    (a) =>
                      a.id !== 'bustDifference' &&
                      isBodyAttributeVisible(a, profile.appearance),
                  )
                  .map(
                    (a) =>
                      `${a.label} ${String(body[a.id] ?? a.default)}${a.unit === '%' ? '' : ' '}${a.unit}`,
                  )
                  .join(' · ')}
              </p>
              {sizes.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  Estimated sizes:{' '}
                  {sizes.map((s) => `${s.label} ${s.size}`).join(' · ')}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Outfit
              </h3>
              <p className="text-muted-foreground">{outfit}</p>
            </div>
          </TabsContent>

          {skillDefs.length > 0 && (
            <TabsContent value="skills" className="space-y-3 mt-4">
              {skillDefs.map((def) => {
                const level = skills[def.id] ?? 0;
                return (
                  <div key={def.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{def.name}</span>
                      <span className="font-mono text-muted-foreground">
                        {level}/10
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${String((level / 10) * 100)}%` }}
                      />
                    </div>
                    {def.description && (
                      <p className="text-xs text-muted-foreground">
                        {def.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </TabsContent>
          )}

          <TabsContent value="inventory" className="mt-4 text-sm">
            {items.length > 0 ? (
              <ul className="space-y-1">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Package className="size-3 shrink-0" />
                    {item.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-xs">
                Your inventory is empty.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
