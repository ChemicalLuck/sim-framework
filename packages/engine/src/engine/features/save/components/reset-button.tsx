import { RotateCcw } from 'lucide-react';
import { Button } from '@sim/engine/components/ui/button';

export default function ResetButton() {
  return (
    <Button
      variant="secondary"
      className="w-full"
      onClick={() => {
        localStorage.removeItem('persist:root');
        localStorage.removeItem('save_1');
        window.location.reload();
      }}
    >
      <RotateCcw className="size-4" />
      Reset
    </Button>
  );
}
