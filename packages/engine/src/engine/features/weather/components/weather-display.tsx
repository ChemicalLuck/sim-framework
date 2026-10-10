import { useEngineSelector } from '@chemicalluck/sim-engine/state/store';

import { getWeatherIcon } from '../lib/icons';
import { selectSeason, selectWeather } from '../selectors';

export default function WeatherDisplay() {
  const weather = useEngineSelector(selectWeather);
  const season = useEngineSelector(selectSeason);
  const Icon = getWeatherIcon(weather.condition);

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
