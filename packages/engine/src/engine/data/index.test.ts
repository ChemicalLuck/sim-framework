import { describe, expect, it } from 'vitest';

import type {
  JsonSceneWithId,
  JsonScript,
} from '@chemicalluck/sim-engine/features/core/types';

import { type RawContent, loadContent } from './index';

function raw(
  scenes: JsonSceneWithId[],
  scripts: JsonScript[],
  extra: Partial<RawContent> = {},
): RawContent {
  return { items: [], templates: [], scenes, scripts, ...extra };
}

function sceneWithEffect(
  id: string,
  effect: JsonSceneWithId['actions'][number]['actions'][number]['effects'][number],
): JsonSceneWithId {
  return {
    id,
    kind: 'scene',
    text: id,
    actions: [{ actions: [{ kind: 'action', text: 'Go', effects: [effect] }] }],
  };
}

const plainScene: JsonSceneWithId = {
  id: 'room',
  kind: 'scene',
  text: 'A room.',
  actions: [],
};

function firstEffect(scene: {
  actions: { actions: { effects?: unknown[] }[] }[];
}) {
  return scene.actions[0].actions[0].effects?.[0];
}

describe('loadContent', () => {
  it('resolves a sceneId view effect inside a script', () => {
    const script: JsonScript = {
      id: 'shift',
      order: 'sequential',
      duration: 60,
      scenes: [
        {
          kind: 'scene',
          text: 'Work.',
          actions: [
            {
              actions: [
                {
                  kind: 'action',
                  text: 'Walk out',
                  effects: [
                    {
                      kind: 'view',
                      activeViewId: 'SceneView',
                      sceneId: 'room',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const content = loadContent(raw([plainScene], [script]));
    const room = content.scenes.get('room');
    expect(firstEffect(content.scripts.get('shift').scenes[0])).toEqual({
      kind: 'view',
      activeViewId: 'SceneView',
      props: { scene: room },
    });
    expect(room.text).toBe('A room.');
  });

  it('still resolves a scriptId view effect inside a scene', () => {
    const script: JsonScript = {
      id: 'shift',
      order: 'sequential',
      duration: 60,
      scenes: [{ kind: 'scene', text: 'Work.', actions: [] }],
    };
    const content = loadContent(
      raw(
        [
          sceneWithEffect('door', {
            kind: 'view',
            activeViewId: 'ScriptView',
            scriptId: 'shift',
          }),
        ],
        [script],
      ),
    );
    const effect = firstEffect(content.scenes.get('door')) as {
      props: { script: unknown };
    };
    expect(effect.props.script).toBe(content.scripts.get('shift'));
    expect(content.scripts.get('shift').duration).toBe(60);
  });

  it('resolves a sceneId view effect inside another scene', () => {
    const content = loadContent(
      raw(
        [
          sceneWithEffect('hall', {
            kind: 'view',
            activeViewId: 'SceneView',
            sceneId: 'room',
          }),
          plainScene,
        ],
        [],
      ),
    );
    const effect = firstEffect(content.scenes.get('hall')) as {
      props: { scene: unknown };
    };
    expect(effect.props.scene).toBe(content.scenes.get('room'));
  });

  it('throws on an unknown sceneId', () => {
    expect(() =>
      loadContent(
        raw(
          [
            sceneWithEffect('hall', {
              kind: 'view',
              activeViewId: 'SceneView',
              sceneId: 'nowhere',
            }),
          ],
          [],
        ),
      ),
    ).toThrow(/scene not found: nowhere/);
  });

  it('rejects circular scene/script references, which saves cannot store', () => {
    const script: JsonScript = {
      id: 'loop',
      order: 'sequential',
      duration: 60,
      scenes: [
        {
          kind: 'scene',
          text: 'Work.',
          actions: [
            {
              actions: [
                {
                  kind: 'action',
                  text: 'Back',
                  effects: [
                    {
                      kind: 'view',
                      activeViewId: 'SceneView',
                      sceneId: 'door',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(() =>
      loadContent(
        raw(
          [
            sceneWithEffect('door', {
              kind: 'view',
              activeViewId: 'ScriptView',
              scriptId: 'loop',
            }),
          ],
          [script],
        ),
      ),
    ).toThrow(/circular reference.*door/);
  });

  it('gives data extensions fully hydrated scenes and scripts', () => {
    const content = loadContent(
      raw([plainScene], [], {
        extensions: [
          {
            key: 'probe' as never,
            data: null,
            hydrate: (_data, ctx) => ctx.scenes.get('room').text,
          },
        ],
      }),
    );
    expect(
      (content.extensions as unknown as Record<string, unknown>).probe,
    ).toBe('A room.');
  });
});
