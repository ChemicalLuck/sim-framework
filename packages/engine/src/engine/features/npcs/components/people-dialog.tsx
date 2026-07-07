import { RefreshCw, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@chemicalluck/engine/components/ui/button';
import { Card } from '@chemicalluck/engine/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@chemicalluck/engine/components/ui/dialog';
import Roundel from '@chemicalluck/engine/components/ui/roundel';
import { ScrollArea } from '@chemicalluck/engine/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@chemicalluck/engine/components/ui/tabs';
import {
  describeStranger,
  getRelationshipGroup,
} from '@chemicalluck/engine/features/npcs/lib/npcs';
import {
  selectNpcsKnown,
  selectNpcsNearby,
} from '@chemicalluck/engine/features/npcs/selectors';
import { regenerateNpcs } from '@chemicalluck/engine/features/npcs/slice';
import type { NPC } from '@chemicalluck/engine/features/npcs/types';
import { selectRelationships } from '@chemicalluck/engine/features/relationships/selectors';
import { setView } from '@chemicalluck/engine/features/view/slice';
import { useEngineDispatch, useEngineSelector } from '@chemicalluck/engine/state/store';

const GROUP_LABELS: Record<string, string> = {
  romantic: 'Romantic',
  friends: 'Friends',
  acquaintances: 'Acquaintances',
  strangers: 'Strangers',
  known: 'Known',
};

const GROUP_ORDER = [
  'romantic',
  'friends',
  'acquaintances',
  'strangers',
  'known',
] as const;

export default function PeopleDialog() {
  const [open, setOpen] = useState(false);
  const dispatch = useEngineDispatch();
  const known = useEngineSelector(selectNpcsKnown);
  const nearby = useEngineSelector(selectNpcsNearby);
  const relationships = useEngineSelector(selectRelationships);

  const grouped = nearby.reduce<Record<string, NPC[]>>(
    (acc, npc) => {
      const group = getRelationshipGroup(relationships[npc.id]);
      (acc[group] ??= []).push(npc);
      return acc;
    },
    { known },
  );

  const activeTabs = GROUP_ORDER.filter((g) => grouped[g]?.length); // eslint-disable-line
  const defaultTab = activeTabs[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full cursor-pointer relative">
          <Users className="size-4" />
          People
          <Roundel count={nearby.length} />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-screen h-[95vh] flex flex-col p-4 gap-2">
        <DialogHeader className="flex flex-row items-center pr-8">
          <DialogTitle className="flex-1">People</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(regenerateNpcs(Date.now()))}
          >
            <RefreshCw className="size-4" />
          </Button>
        </DialogHeader>
        <Tabs
          defaultValue={defaultTab}
          className="flex flex-col flex-1 min-h-0"
        >
          <TabsList className="w-full">
            {activeTabs.map((group) => (
              <TabsTrigger key={group} value={group} className="flex-1">
                {GROUP_LABELS[group]}
              </TabsTrigger>
            ))}
          </TabsList>
          {activeTabs.map((group) => (
            <TabsContent
              key={group}
              value={group}
              className="flex-1 min-h-0 mt-2"
            >
              <ScrollArea className="h-full p-3" type="always">
                {grouped[group].map((npc) => (
                  <Card
                    key={npc.id}
                    className="mb-2 p-3 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      dispatch(
                        setView({
                          activeViewId: 'NpcView',
                          props: { npcId: npc.id },
                        }),
                      );
                      setOpen(false);
                    }}
                  >
                    {!(npc.id in relationships)
                      ? describeStranger(npc)
                      : `${npc.profile.firstName} ${npc.profile.lastName}`}
                  </Card>
                ))}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
