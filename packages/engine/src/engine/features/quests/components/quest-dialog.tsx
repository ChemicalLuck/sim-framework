import { ScrollText } from 'lucide-react';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@chemicalluck/sim-engine/components/ui/dialog';
import Roundel from '@chemicalluck/sim-engine/components/ui/roundel';
import {
  selectActiveQuests,
  selectCompletedQuests,
} from '@chemicalluck/sim-engine/features/quests/selectors';
import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

import QuestCard from './quest-card';

export default function QuestsDialog() {
  const activeQuests = useEngineSelector(selectActiveQuests);
  const completedQuests = useEngineSelector(selectCompletedQuests);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="relative w-full">
          <ScrollText className="size-4" />
          Quests
          <Roundel count={activeQuests.length} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quests</DialogTitle>
        </DialogHeader>
        {activeQuests.length > 0 && (
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active
          </h3>
        )}
        {activeQuests.map((q) => (
          <QuestCard quest={q} key={q.id} />
        ))}
        {completedQuests.length > 0 && (
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Completed
          </h3>
        )}
        {completedQuests.map((q) => (
          <QuestCard quest={q} key={q.id} />
        ))}
      </DialogContent>
    </Dialog>
  );
}
