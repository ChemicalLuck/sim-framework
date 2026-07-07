import { describe, expect, it } from 'vitest';

import reducer, {
  addWearMinutes,
  cleanItems,
  ensureItems,
  setWet,
} from './slice';
import { DIRTY_THRESHOLD_MINUTES } from './types';

describe('clothing slice', () => {
  it('starts empty', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({});
  });

  it('ensureItems seeds default state for each id', () => {
    const next = reducer({}, ensureItems(['shirt', 'pants']));
    expect(next.shirt).toEqual({
      isWet: false,
      isDirty: false,
      wearMinutes: 0,
    });
    expect(next.pants).toEqual({
      isWet: false,
      isDirty: false,
      wearMinutes: 0,
    });
  });

  it('ensureItems does not overwrite existing items', () => {
    const before = {
      shirt: { isWet: true, isDirty: true, wearMinutes: 100 },
    };
    const after = reducer(before, ensureItems(['shirt']));
    expect(after.shirt).toEqual(before.shirt);
  });

  it('addWearMinutes accumulates wearMinutes', () => {
    const next = reducer(
      { shirt: { isWet: false, isDirty: false, wearMinutes: 60 } },
      addWearMinutes({ ids: ['shirt'], minutes: 30 }),
    );
    expect(next.shirt?.wearMinutes).toBe(90);
    expect(next.shirt?.isDirty).toBe(false);
  });

  it('addWearMinutes flips isDirty once the threshold is crossed', () => {
    const next = reducer(
      {
        shirt: {
          isWet: false,
          isDirty: false,
          wearMinutes: DIRTY_THRESHOLD_MINUTES - 1,
        },
      },
      addWearMinutes({ ids: ['shirt'], minutes: 5 }),
    );
    expect(next.shirt?.isDirty).toBe(true);
  });

  it('addWearMinutes initialises unseen items with the accumulated time', () => {
    const next = reducer({}, addWearMinutes({ ids: ['hat'], minutes: 10 }));
    expect(next.hat).toEqual({ isWet: false, isDirty: false, wearMinutes: 10 });
  });

  it('setWet flips isWet for known and unknown items', () => {
    const next = reducer(
      { shirt: { isWet: false, isDirty: false, wearMinutes: 0 } },
      setWet({ ids: ['shirt', 'hat'], wet: true }),
    );
    expect(next.shirt?.isWet).toBe(true);
    expect(next.hat).toEqual({ isWet: true, isDirty: false, wearMinutes: 0 });
  });

  it('cleanItems resets named items', () => {
    const next = reducer(
      { shirt: { isWet: true, isDirty: true, wearMinutes: 500 } },
      cleanItems({ ids: ['shirt'] }),
    );
    expect(next.shirt).toEqual({
      isWet: false,
      isDirty: false,
      wearMinutes: 0,
    });
  });

  it("cleanItems with ids: '*' resets every tracked item", () => {
    const next = reducer(
      {
        shirt: { isWet: true, isDirty: true, wearMinutes: 500 },
        pants: { isWet: false, isDirty: true, wearMinutes: 600 },
      },
      cleanItems({ ids: '*' }),
    );
    expect(next.shirt).toEqual({
      isWet: false,
      isDirty: false,
      wearMinutes: 0,
    });
    expect(next.pants).toEqual({
      isWet: false,
      isDirty: false,
      wearMinutes: 0,
    });
  });
});
