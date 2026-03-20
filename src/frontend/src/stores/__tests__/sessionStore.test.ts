// @vitest-environment jsdom
import { describe, it, beforeEach, expect } from 'vitest';
import { useSessionStore, type SplitMode } from '../sessionStore';

function getStore() {
  return useSessionStore.getState();
}

describe('sessionStore — split mode', () => {
  beforeEach(() => {
    getStore().setSplit('off');
  });

  it('initializes with split mode "off"', () => {
    expect(getStore().splitMode).toBe('off');
  });

  it('toggleSplit cycles off → vertical → horizontal → off', () => {
    getStore().toggleSplit();
    expect(getStore().splitMode).toBe('vertical');

    getStore().toggleSplit();
    expect(getStore().splitMode).toBe('horizontal');

    getStore().toggleSplit();
    expect(getStore().splitMode).toBe('off');
  });

  it('setSplit sets the mode directly', () => {
    getStore().setSplit('horizontal');
    expect(getStore().splitMode).toBe('horizontal');

    getStore().setSplit('vertical');
    expect(getStore().splitMode).toBe('vertical');

    getStore().setSplit('off');
    expect(getStore().splitMode).toBe('off');
  });

  it('cycles wrap correctly over multiple full rotations', () => {
    const expected: SplitMode[] = ['vertical', 'horizontal', 'off'];

    for (let cycle = 0; cycle < 3; cycle++) {
      for (const mode of expected) {
        getStore().toggleSplit();
        expect(getStore().splitMode).toBe(mode);
      }
    }
  });

  it('setSplit then toggleSplit continues from current position', () => {
    getStore().setSplit('horizontal');
    getStore().toggleSplit();
    expect(getStore().splitMode).toBe('off');

    getStore().setSplit('vertical');
    getStore().toggleSplit();
    expect(getStore().splitMode).toBe('horizontal');
  });
});
