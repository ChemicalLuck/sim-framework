import { AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@chemicalluck/sim-engine/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@chemicalluck/sim-engine/components/ui/dialog';
import { ScrollArea } from '@chemicalluck/sim-engine/components/ui/scroll-area';

import {
  sourceToPath,
  useMissingRequiredFiles,
  useValidationIssues,
} from '../lib/validation';

export function ProblemsButton() {
  const issues = useValidationIssues();
  const missingFiles = useMissingRequiredFiles();
  const [open, setOpen] = useState(false);
  const count = issues.length + missingFiles.length;

  if (count === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-500/80">
        <Check size={13} /> No problems
      </span>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setOpen(true);
        }}
        className="h-7 gap-1 text-red-400 hover:text-red-300"
      >
        <AlertTriangle size={14} />
        {count} problem{count === 1 ? '' : 's'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Data problems ({count})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <ul className="space-y-1 pr-2">
              {missingFiles.map((file) => (
                <li
                  key={`missing-${file}`}
                  className="text-sm border-b border-zinc-800 pb-1"
                >
                  <span className="font-mono text-xs text-zinc-200">
                    {file}.json
                  </span>
                  <span className="text-zinc-400">
                    {' '}
                    — required data file is missing (saving its panel creates
                    it)
                  </span>
                </li>
              ))}
              {issues.map((issue, i) => (
                <li
                  key={`${issue.source}-${String(i)}`}
                  className="text-sm border-b border-zinc-800 pb-1"
                >
                  <Link
                    to={sourceToPath(issue.source) ?? '#'}
                    onClick={() => {
                      setOpen(false);
                    }}
                    className="font-mono text-xs text-blue-400 hover:underline"
                  >
                    {issue.source}
                  </Link>
                  <span className="text-zinc-400"> — {issue.message}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
