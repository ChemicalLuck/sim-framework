import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@chemicalluck/engine/components/ui/button';

import { MockStateForm } from './mock-state-form';
import { NarrativePreview, type PreviewEntity } from './narrative-preview';
import { type SandboxEntity, SandboxView } from './sandbox/sandbox-view';

type Mode = 'readonly' | 'sim';

function isSimulatable(entity: PreviewEntity): entity is SandboxEntity {
  return entity.kind !== 'quest' && entity.kind !== 'questTemplate';
}

/**
 * Collapsible "Preview" section embedded in a narrative panel's detail view.
 * Read-only renders the selected entity with condition badges + effect chips;
 * Simulate mounts the real in-game view in a sandbox so actions run for real.
 */
export function PreviewPane(props: PreviewEntity) {
  const [open, setOpen] = useState(true);
  const [showState, setShowState] = useState(false);
  const [mode, setMode] = useState<Mode>('readonly');

  const canSim = isSimulatable(props);
  const simActive = canSim && mode === 'sim';

  return (
    <div className="mt-4 rounded-lg border border-zinc-700">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
          }}
          className="flex items-center gap-1 text-sm font-medium text-zinc-200"
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Preview
        </button>
        {open && canSim && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={mode === 'readonly' ? 'default' : 'outline'}
              onClick={() => {
                setMode('readonly');
              }}
            >
              Read-only
            </Button>
            <Button
              size="sm"
              variant={mode === 'sim' ? 'default' : 'outline'}
              onClick={() => {
                setMode('sim');
              }}
            >
              Simulate
            </Button>
          </div>
        )}
      </div>

      {open && (
        <div className="space-y-3 border-t border-zinc-800 p-3">
          {!simActive && (
            <>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setShowState((v) => !v);
                  }}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  {showState ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  Mock state
                </button>
                {showState && (
                  <div className="mt-2">
                    <MockStateForm />
                  </div>
                )}
              </div>
              <NarrativePreview {...props} />
            </>
          )}
          {mode === 'sim' && isSimulatable(props) && <SandboxView {...props} />}
        </div>
      )}
    </div>
  );
}
