import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cosine, explain, findSimilar, flavorSim, jaccard, similarity } from './similar.ts';
import type { Whisky } from '../types.ts';

const all: Whisky[] = JSON.parse(readFileSync(new URL('../../data/flavor-seed.json', import.meta.url), 'utf8')).whiskies;
const byId = (id: string) => all.find((w) => w.id === `seed-${id}`)!;

test('기본 수학', () => {
  assert.equal(cosine([1, 0], [1, 0]), 1);
  assert.equal(cosine([0, 0], [1, 0]), 0);
  assert.equal(flavorSim([1, 2, 3], [1, 2, 3]), 1);
  assert.equal(jaccard(['a', 'b'], ['b', 'c']), 1 / 3);
});

test('자기 자신과의 유사도가 가장 높다', () => {
  const m = byId('macallan-12-sherry-oak');
  assert.ok(similarity(m, m) > similarity(m, byId('laphroaig-10')));
});

test('셰리 위스키와 비슷한 것은 셰리 계열', () => {
  const r = findSimilar(byId('macallan-12-sherry-oak'), all, { limit: 5 });
  assert.equal(r.length, 5);
  const sherry = r.filter((x) => x.whisky.casks?.includes('sherry')).length;
  assert.ok(sherry >= 4, r.map((x) => x.whisky.id).join(','));
  assert.ok(!r.some((x) => x.whisky.id === 'seed-macallan-12-sherry-oak'));
});

test('피트 위스키와 비슷한 것은 피트 위스키', () => {
  const r = findSimilar(byId('laphroaig-10'), all, { limit: 5 });
  assert.ok(r.every((x) => x.whisky.peated), r.map((x) => x.whisky.id).join(','));
});

test('같은 브랜드는 최대 2개', () => {
  const r = findSimilar(byId('ardbeg-10'), all, { limit: 10 });
  const counts = new Map<string, number>();
  r.forEach((x) => counts.set(x.whisky.brand!, (counts.get(x.whisky.brand!) ?? 0) + 1));
  assert.ok([...counts.values()].every((c) => c <= 2));
});

test('더 저렴한 대체: 모두 기준가의 75% 이하', () => {
  const base = byId('macallan-18-sherry-oak');
  const r = findSimilar(base, all, { mode: 'cheaper', limit: 5 });
  assert.ok(r.length > 0);
  assert.ok(r.every((x) => x.whisky.price! <= base.price! * 0.75));
});

test('한 단계 업그레이드: 더 비싸고 숙성이 같거나 길다', () => {
  const base = byId('glenfiddich-12');
  const r = findSimilar(base, all, { mode: 'upgrade', limit: 5 });
  assert.ok(r.length > 0);
  assert.ok(r.every((x) => x.whisky.price! > base.price! && (x.whisky.age ?? 0) >= 12));
});

test('한 축만 바꾸기: 더 스모키하게', () => {
  const base = byId('glenfiddich-12');
  const r = findSimilar(base, all, { mode: 'shift', shift: { axis: 'smoky', delta: 2 }, limit: 5 });
  assert.ok(r.length > 0);
  assert.ok(r.every((x) => x.whisky.flavor![1] > base.flavor![1]));
});

test('설명: 공통점 최대 3개, 가격 차이 표시', () => {
  const e = explain(byId('macallan-12-sherry-oak'), byId('glendronach-12'));
  assert.ok(e.common.length >= 1 && e.common.length <= 3);
  assert.ok(e.common.includes('셰리 캐스크'));
  assert.match(e.diff ?? '', /저렴/);
});

test('맛 정보 없는 위스키는 추천 대상에서 빠진다', () => {
  const noFlavor: Whisky = { id: 'off-1', source: 'off', name: 'X', country: '', type: 'other', grade: 'C' };
  assert.deepEqual(findSimilar(noFlavor, all), []);
  assert.ok(!findSimilar(byId('glenfiddich-12'), [...all, noFlavor], { limit: 100 }).some((x) => x.whisky.id === 'off-1'));
});
