import { PencilRuler } from 'lucide-react';
import { Button } from '@chemicalluck/engine/components/ui/button';
import { isDebug } from '@chemicalluck/engine/hooks/use-debug';

export default function EditorButton() {
  const debug = isDebug();
  if (!debug) return null;

  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() => window.open('/editor', '_blank')}
    >
      <PencilRuler className="size-4" />
      Editor
    </Button>
  );
}
