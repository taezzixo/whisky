import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadTheme, parseTheme, resolveTheme, saveTheme, THEME_KEY } from './theme.ts';

test('테마: 고른 값이 기기 설정보다 먼저, 잘못된 값은 무시', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
  assert.equal(resolveTheme(null, true), 'dark');
  assert.equal(resolveTheme(null, false), 'light');
  assert.equal(parseTheme('sepia'), null);
  const mem = new Map<string, string>();
  saveTheme('dark', { setItem: (k, v) => void mem.set(k, v) });
  assert.equal(mem.get(THEME_KEY), 'dark');
  assert.equal(loadTheme({ getItem: (k) => mem.get(k) ?? null }), 'dark');
  assert.equal(loadTheme({ getItem: () => { throw new Error('blocked'); } }), null);
});
