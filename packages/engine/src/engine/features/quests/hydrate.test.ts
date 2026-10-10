import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { loadContent } from '@chemicalluck/sim-engine/data';
import type { JsonSceneWithId } from '@chemicalluck/sim-engine/features/core/types';

import type { JsonQuest } from './authoring.types';
import { hydrateQuests } from './hydrate';

const STARTER_DATA = path.resolve(
  import.meta.dirname,
  '../../../../../../templates/starter/src/game/data',
);

const room: JsonSceneWithId = {
  id: 'room',
  kind: 'scene',
  text: 'A room.',
  actions: [],
};

const toRoom = {
  kind: 'view',
  activeViewId: 'SceneView',
  sceneId: 'room',
} as const;

function load(quests: unknown) {
  return loadContent({
    items: [],
    templates: [],
    scenes: [room],
    scripts: [],
    extensions: [
      {
        key: 'quests',
        data: quests,
        hydrate: (data, ctx) => hydrateQuests(data as JsonQuest[], ctx),
      },
    ],
  });
}

describe('hydrateQuests', () => {
  const quests: JsonQuest[] = [
    {
      id: 'q',
      name: 'Quest',
      objectives: [
        {
          name: 'go',
          state: 'available',
          condition: { kind: 'action', text: 'Go', effects: [toRoom] },
          onComplete: [toRoom],
        },
        {
          name: 'ask',
          state: 'locked',
          trigger: { kind: 'action', text: 'Ask', effects: [toRoom] },
          condition: {
            kind: 'eq',
            lhs: { kind: 'const', value: 1 },
            rhs: { kind: 'const', value: 1 },
          },
        },
        {
          name: 'visit',
          state: 'available',
          condition: { kind: 'scene', sceneId: 'room' },
        },
      ],
    },
  ];

  it('resolves shorthand effects in quests after scenes are hydrated', () => {
    const content = load(quests);
    const scene = content.scenes.get('room');
    const resolved = {
      kind: 'view',
      activeViewId: 'SceneView',
      props: { scene },
    };
    const [go, ask, visit] = content.extensions.quests[0].objectives;

    expect(go.onComplete).toEqual([resolved]);
    expect(go.condition).toMatchObject({ kind: 'action', effects: [resolved] });
    expect(ask.trigger).toMatchObject({ kind: 'action', effects: [resolved] });
    expect(ask.condition).toEqual(quests[0].objectives[1].condition);
    expect(visit.condition).toBe(scene);
  });

  it('keeps names, ids and states', () => {
    const [quest] = load(quests).extensions.quests;
    expect(quest.id).toBe('q');
    expect(quest.name).toBe('Quest');
    expect(quest.objectives.map((o) => [o.name, o.state])).toEqual([
      ['go', 'available'],
      ['ask', 'locked'],
      ['visit', 'available'],
    ]);
  });

  it('loads the starter quests.json', () => {
    const json = JSON.parse(
      fs.readFileSync(path.join(STARTER_DATA, 'quests.json'), 'utf8'),
    ) as unknown;
    expect(() => load(json)).not.toThrow();
  });
});
