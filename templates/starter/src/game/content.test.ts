// Example game test. `npm test` runs every src/**/*.test.{ts,tsx} with the same
// engine setup as `npm run dev`, so game content and `virtual:*` modules load.
import 'virtual:game-setup';
import { getLocationById } from '@chemicalluck/sim-engine/features/travel/lib/world';

describe('game content', () => {
  it('loads the world', () => {
    expect(getLocationById('bedroom')?.name).toBe('Bedroom');
  });
});
