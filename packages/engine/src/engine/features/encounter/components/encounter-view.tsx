import WithSidebar from '@chemicalluck/sim-engine/components/with-sidebar';
import {
  setEncounterState,
  setPlayerAction,
} from '@chemicalluck/sim-engine/features/encounter/slice';
import {
  processTurn,
  stopEncounterThunk,
} from '@chemicalluck/sim-engine/features/encounter/thunks';
import { renderText } from '@chemicalluck/sim-engine/features/linguistics/lib/template';
import { useTemplateContext } from '@chemicalluck/sim-engine/features/linguistics/use-template-context';
import { selectNpcById } from '@chemicalluck/sim-engine/features/npcs/selectors';
import { isConditionMet } from '@chemicalluck/sim-engine/lib/conditions/evaluator';
import { cn } from '@chemicalluck/sim-engine/lib/css';
import { useEngineDispatch, useEngineSelector } from '@chemicalluck/sim-engine/state/store';

function EncounterView() {
  const dispatch = useEngineDispatch();
  const fullState = useEngineSelector((s) => s);
  const {
    encounter,
    npcId,
    currentStateId,
    playerActiveActions,
    npcActiveActions,
    npcNeeds,
  } = useEngineSelector((s) => s.present.encounter);

  const npc = useEngineSelector(selectNpcById(npcId ?? ''));
  const ctx = useTemplateContext(npc ? [npc] : []);

  if (!encounter || !currentStateId) return null;

  const currentState = encounter.states.find((s) => s.id === currentStateId);
  if (!currentState) return null;

  const resolvedText = renderText(currentState.text, ctx);

  // Filter actions whose condition is met, then group by body part
  const availableActions = currentState.actions.filter((a) =>
    isConditionMet(fullState, a.condition),
  );

  const actionsByBodyPart: Record<string, typeof availableActions> = {};
  for (const action of availableActions) {
    (actionsByBodyPart[action.bodyPart] ??= []).push(action);
  }

  function handleToggle(bodyPart: string, actionId: string) {
    const currentActive = playerActiveActions[bodyPart];
    if (currentActive === actionId) {
      dispatch(setPlayerAction({ bodyPart, actionId: null }));
    } else {
      dispatch(setPlayerAction({ bodyPart, actionId }));
      const action = currentState?.actions.find((a) => a.id === actionId);
      if (action?.activateTransition) {
        dispatch(setEncounterState(action.activateTransition));
      }
    }
  }

  // NPC's last active action labels
  const npcActionLabels = Object.values(npcActiveActions)
    .filter(Boolean)
    .map((id) => currentState.actions.find((a) => a.id === id)?.text)
    .filter(Boolean);

  return (
    <WithSidebar>
      {/* State description */}
      <p className="mb-6 leading-relaxed">{resolvedText}</p>

      {/* Player action toggles grouped by body part */}
      <div className="space-y-4 mb-6">
        {Object.entries(actionsByBodyPart).map(([bodyPart, actions]) => (
          <div key={bodyPart}>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              {bodyPart}
            </h3>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => {
                const isActive =
                  playerActiveActions[action.bodyPart] === action.id;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      handleToggle(bodyPart, action.id);
                    }}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md border transition-colors cursor-pointer',
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-zinc-600 text-zinc-300 hover:border-zinc-400 hover:text-zinc-100',
                    )}
                  >
                    {action.text}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {availableActions.length === 0 && (
          <p className="text-sm text-zinc-500 italic">No actions available.</p>
        )}
      </div>

      {/* NPC's current action */}
      {npc && npcActionLabels.length > 0 && (
        <p className="text-sm text-zinc-400 mb-4">
          <span className="font-medium text-zinc-300">
            {npc.profile.firstName}
          </span>
          {': '}
          {npcActionLabels.join(', ')}
        </p>
      )}

      {/* NPC needs */}
      {Object.keys(npcNeeds).length > 0 && (
        <div className="mb-6 space-y-1.5">
          {Object.entries(npcNeeds).map(([need, value]) => (
            <div key={need} className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 w-20 shrink-0">
                {npc ? `${npc.profile.firstName}'s ` : ''}
                {need}
              </span>
              <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${String(Math.max(0, Math.min(100, value)))}%`,
                  }}
                />
              </div>
              <span className="text-xs text-zinc-500 w-7 text-right tabular-nums">
                {Math.round(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            dispatch(processTurn());
          }}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md border transition-colors cursor-pointer',
            'border-primary bg-primary/10 text-primary hover:bg-primary/20',
          )}
        >
          Next Turn
        </button>
        <button
          onClick={() => {
            dispatch(stopEncounterThunk());
          }}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md border transition-colors cursor-pointer',
            'border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-zinc-200',
          )}
        >
          Stop
        </button>
      </div>
    </WithSidebar>
  );
}

export default EncounterView;
