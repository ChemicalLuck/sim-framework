import { selectAppearanceDescription } from '@sim/engine/features/player/selectors';
import { useEngineSelector } from '@sim/engine/state/store';

export default function AppearanceDisplay() {
  const appearanceDescription = useEngineSelector(selectAppearanceDescription);

  return (
    <p className="text-center text-xs text-muted-foreground leading-snug px-1">
      {appearanceDescription}
    </p>
  );
}
