import { useEngineSelector } from '@sim/engine/state/store';

import { WEATHER_ICON_MAP } from '../lib/icons';
import { selectSeason, selectWeather } from '../selectors';

export default function WeatherDisplay() {
  const weather = useEngineSelector(selectWeather);
  const season = useEngineSelector(selectSeason);
  const Icon = WEATHER_ICON_MAP[weather.conditionId];

  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <Icon className={`size-4 ${weather.condition.iconColor}`} />
      <span className="text-sm font-semibold tabular-nums">
        {weather.temperature}°C
      </span>
      <span className="text-xs text-muted-foreground">
        {weather.condition.label}
      </span>
      <span className="text-xs text-muted-foreground capitalize">{season}</span>
    </div>
  );
}
