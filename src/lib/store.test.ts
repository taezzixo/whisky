import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, loadUserData, mergeUserData, parseUserData, saveUserData, STORE_KEY, toggle } from './store.ts';
import { applyOverrides, searchWhiskies } from './overrides.ts';
import type { Whisky } from '../types.ts';

test('잘못된 저장값은 빈 데이터로', () => {
  assert.deepEqual(parseUserData(null), emptyData());
  assert.deepEqual(parseUserData({ wishlist: ['a', 'a', 3] }).wishlist, ['a']);
  assert.deepEqual(loadUserData({ getItem: () => '{broken' }), emptyData());
});

test('저장·불러오기', () => {
  const mem = new Map<string, string>();
  const st = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  saveUserData({ ...emptyData(), wishlist: ['seed-a'] }, st);
  assert.ok(mem.has(STORE_KEY));
  assert.deepEqual(loadUserData(st).wishlist, ['seed-a']);
});

test('toggle·merge', () => {
  assert.deepEqual(toggle(['a'], 'a'), []);
  assert.deepEqual(toggle([], 'a'), ['a']);
  const m = mergeUserData({ ...emptyData(), tried: ['a'] }, { ...emptyData(), tried: ['b', 'a'] });
  assert.deepEqual(m.tried, ['a', 'b']);
});

const w = (id: string, name: string, extra: Partial<Whisky> = {}): Whisky => ({ id, source: 'seed', name, country: '', type: 'other', grade: 'C', ...extra });

test('수동 보정: 숨김·패치·수동 등록', () => {
  const out = applyOverrides([w('a', 'A'), w('b', 'B')], { hide: ['a'], patch: { b: { nameKo: '비' } }, manual: [w('manual-c', 'C'), w('b', 'dup')] });
  assert.deepEqual(out.map((x) => x.id), ['b', 'manual-c']);
  assert.equal(out[0].nameKo, '비');
  assert.equal(out[1].manual, true);
});

test('검색: 한글·영문·공백 무시', () => {
  const items = [w('1', 'The Macallan 12', { nameKo: '맥캘란 12년' }), w('2', 'Glenfiddich 12', { nameKo: '글렌피딕 12년' })];
  assert.deepEqual(searchWhiskies(items, '맥캘란').map((x) => x.id), ['1']);
  assert.deepEqual(searchWhiskies(items, 'glen fiddich').map((x) => x.id), ['2']);
});
