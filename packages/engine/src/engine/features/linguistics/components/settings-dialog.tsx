import { Settings } from 'lucide-react';
import { Button } from '@chemicalluck/engine/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@chemicalluck/engine/components/ui/dialog';
import { Input } from '@chemicalluck/engine/components/ui/input';
import { getTerms } from '@chemicalluck/engine/features/linguistics/lib/config';
import { setWordChoice } from '@chemicalluck/engine/features/linguistics/slice';
import { useEngineDispatch, useEngineSelector } from '@chemicalluck/engine/state/store';

export default function SettingsDialog() {
  const terms = [...getTerms().values()];
  const wordChoices = useEngineSelector(
    (s) => s.present.linguistics.wordChoices,
  );
  const dispatch = useEngineDispatch();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          <Settings className="size-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wording</DialogTitle>
          <DialogDescription>
            Choose the words used to describe things. Enter a comma-separated
            list; repeat a word to make it more likely.
          </DialogDescription>
        </DialogHeader>

        {terms.length > 0 ? (
          <div className="space-y-3">
            {terms.map((term) => (
              <div key={term.key} className="space-y-1">
                <label className="text-sm font-medium">{term.label}</label>
                <Input
                  value={wordChoices[term.key] ?? ''}
                  placeholder={term.options.join(', ')}
                  onChange={(e) => {
                    dispatch(
                      setWordChoice({ key: term.key, value: e.target.value }),
                    );
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            No customisable words are defined.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
