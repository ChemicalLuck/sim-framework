import { Link } from 'react-router';
import { Badge } from '@chemicalluck/sim-engine/components/ui/badge';

import { sourceToPath } from '../lib/validation';

interface ReferencedByProps {
  refs: string[];
}

export function ReferencedBy({ refs }: ReferencedByProps) {
  if (!refs.length) return null;
  return (
    <div className="space-y-1">
      <p className="text-zinc-400">Referenced by</p>
      <div className="flex flex-wrap gap-1">
        {refs.map((ref) => {
          const path = sourceToPath(ref);
          return path ? (
            <Badge key={ref} variant="secondary" asChild>
              <Link to={path}>{ref}</Link>
            </Badge>
          ) : (
            <Badge key={ref} variant="secondary">
              {ref}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
