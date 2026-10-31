import { describe, expect, it } from 'vitest';
import { normHash, step, type TrailEntry } from '../../src/app/navTrail';

const e = (hash: string, y = 0): TrailEntry => ({ hash, title: hash, y });

describe('navTrail.step', () => {
  it('pushes the page being left', () => {
    const r = step([], e('#/aprender/l1-1', 300), '#/praticar/cordas');
    expect(r.trail.map((t) => t.hash)).toEqual(['#/aprender/l1-1']);
    expect(r.restore).toBeNull();
  });

  it('going back pops the entry and restores its scroll', () => {
    const r = step([e('#/'), e('#/aprender/l1-1', 300)], e('#/praticar/cordas'), '#/aprender/l1-1');
    expect(r.trail.map((t) => t.hash)).toEqual(['#/']);
    expect(r.restore).toBe(300);
  });

  it('jumping to a screen deeper in the trail cuts it without restoring', () => {
    const r = step([e('#/'), e('#/aprender'), e('#/aprender/l1-1')], e('#/praticar/cordas'), '#/');
    expect(r.trail).toEqual([]);
    expect(r.restore).toBeNull();
  });

  it('ignores a navigation to the same screen', () => {
    const r = step([e('#/')], e('#/acordes'), '#/acordes');
    expect(r.trail.map((t) => t.hash)).toEqual(['#/']);
  });

  it('keeps at most 30 entries', () => {
    let trail: TrailEntry[] = [];
    for (let i = 0; i < 40; i++) trail = step(trail, e(`#/x${i}`), `#/x${i + 1}`).trail;
    expect(trail).toHaveLength(30);
    expect(trail[29]?.hash).toBe('#/x39');
  });

  it('normalises the empty hash', () => {
    expect(normHash('')).toBe('#/');
    expect(normHash('#')).toBe('#/');
    expect(normHash('#/afinador')).toBe('#/afinador');
  });
});
