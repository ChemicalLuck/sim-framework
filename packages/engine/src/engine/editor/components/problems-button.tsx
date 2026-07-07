import { AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@chemicalluck/engine/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@chemicalluck/engine/components/ui/dialog';
import { ScrollArea } from '@chemicalluck/engine/components/ui/scroll-area';

import { sourceToPath, useValidationIssues } from '../lib/validation';

export function ProblemsButton() {
  const issues = useValidationIssues();
  const [open, setOpen] = useState(false);

  if (issues.length === 0) {
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
        {issues.length} problem{issues.length === 1 ? '' : 's'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Data problems ({issues.length})</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <ul className="space-y-1 pr-2">
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
