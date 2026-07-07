import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@sim/engine/components/ui/accordion';
import { Card } from '@sim/engine/components/ui/card';
import type { Quest } from '@sim/engine/features/quests/types';

interface QuestCardProps {
  quest: Quest;
}

function QuestCard({ quest }: QuestCardProps) {
  return (
    <Card className="p-4">
      <Accordion type="single" collapsible>
        <AccordionItem value={quest.id}>
          <AccordionTrigger>{quest.name}</AccordionTrigger>
          <AccordionContent>
            <ul className="flex flex-col gap-1 list-disc pl-5">
              {quest.objectives.map((obj) => (
                <li key={obj.name}>
                  <span
                    className={
                      obj.state === 'complete'
                        ? 'line-through text-gray-400'
                        : ''
                    }
                  >
                    {obj.name}
                  </span>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

export default QuestCard;
