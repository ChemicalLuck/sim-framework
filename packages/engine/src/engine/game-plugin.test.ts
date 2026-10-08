import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { gamePlugin } from './game-plugin';

const ENGINE_DIR = import.meta.dirname;

function generateSetup(gameDir: string): string {
  const plugin = gamePlugin({ gameDir, engineDir: ENGINE_DIR });
  const resolveId = plugin.resolveId as (id: string) => string | null;
  const load = plugin.load as (id: string) => string | null;
  const resolved = resolveId('virtual:game-setup');
  if (!resolved) throw new Error('virtual:game-setup did not resolve');
  return load(resolved) ?? '';
}

describe('virtual:game-setup contentSetup bindings', () => {
  let gameDir: string;

  beforeEach(() => {
    gameDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sim-game-'));
    fs.mkdirSync(path.join(gameDir, 'data'));
  });

  afterEach(() => {
    fs.rmSync(gameDir, { recursive: true, force: true });
  });

  it('skips the setup call when its optional content extension is absent', () => {
    const code = generateSetup(gameDir);
    expect(code).not.toContain('configureEncounters');
  });

  it('emits the setup call when the optional content extension is present', () => {
    fs.writeFileSync(path.join(gameDir, 'data', 'encounters.json'), '[]');
    const code = generateSetup(gameDir);
    expect(code).toContain(
      'encounter_configureEncounters(content.extensions.encounters);',
    );
  });
});
