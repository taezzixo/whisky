import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { appendTag, averageFlavor, groupByDistillery, nextPick, noteSuggestions, recentShelf, slugify, topAxes, valueRanking } from './insights.ts';
import type { Tasting } from './collection.ts';
import type { Whisky } from '../types.ts';

const all: Whisky[] = JSON.parse(readFileSync(new URL('../../data/flavor-seed.json', import.meta.url), 'utf8')).whiskies;
const byId = new Map(all.map((w) => [w.id, w]));
const t = (id: string, whisky: string, rating: number): Tasting => ({ id, whiskyId: `seed-${whisky}`, rating, date: '2026-11-01' });

test('slugify: The·작은따옴표·공백을 정리', () => {
  assert.equal(slugify('The Macallan'), 'macallan');
  assert.equal(slugify("Michter's"), 'michters');
  assert.equal(slugify('GlenDronach'), 'glendronach');
});

test('증류소별 묶음: 같은 증류소를 한데 모으고 블렌디드는 뺀다', () => {
  const groups = groupByDistillery(all, new Set(['seed-lagavulin-16']));
  const laga = groups.find((g) => g.slug === 'lagavulin')!;
  assert.ok(laga.whiskies.length >= 4);
  assert.equal(laga.tried, 1);
  assert.equal(laga.region, '아일라');
  assert.ok(laga.top.includes('스모키·피트'));
  assert.ok(!groups.some((g) => g.whiskies.some((w) => w.id === 'seed-hibiki-21')));
  // The Macallan 과 Macallan 은 같은 증류소
  assert.equal(groups.filter((g) => g.slug === 'macallan').length, 1);
});

test('평균 맛·대표 축', () => {
  const f = averageFlavor([byId.get('seed-lagavulin-16')!, byId.get('seed-ardbeg-10')!])!;
  assert.equal(f.length, 10);
  assert.equal(topAxes(f)[0], '스모키·피트');
  assert.deepEqual(topAxes(null), []);
});

test('가성비: 10만 원당 별점이 높은 순, 가격 없는 위스키는 뺀다', () => {
  const rows = valueRanking([t('a', 'glenfiddich-12', 4), t('b', 'macallan-18-sherry-oak', 5), t('c', 'glenfiddich-12', 3)], byId);
  assert.equal(rows[0].w.id, 'seed-glenfiddich-12');
  assert.equal(rows[0].rating, 3.5);
  assert.equal(rows[0].count, 2);
  assert.ok(rows[0].index > rows[1].index);
  const noPrice = new Map(byId);
  noPrice.set('seed-x', { ...byId.get('seed-glenfiddich-12')!, id: 'seed-x', price: undefined });
  assert.equal(valueRanking([{ id: 'x', whiskyId: 'seed-x', rating: 5, date: '2026-11-01' }], noPrice).length, 0);
});

test('노트 도우미: 자유 문장에서 표준 태그를 찾고, 위스키 맛으로 더 제안', () => {
  const { matched, suggested } = noteSuggestions('병원 냄새랑 연기, 끝에 짭짤함', byId.get('seed-lagavulin-16'));
  assert.deepEqual(matched.sort(), ['바다소금', '스모크', '요오드'].sort());
  assert.ok(suggested.length > 0);
  assert.ok(!suggested.includes('요오드'));
  assert.deepEqual(noteSuggestions('', undefined).matched, []);
});

test('appendTag: 쉼표로 덧붙이고 중복은 넣지 않는다', () => {
  assert.equal(appendTag('', '꿀'), '꿀');
  assert.equal(appendTag('달다', '꿀'), '달다, 꿀');
  assert.equal(appendTag('달다, 꿀', '꿀'), '달다, 꿀');
});

test('최근 선반: 최근 순, 같은 위스키는 한 번만(기록 수 합침)', () => {
  const ts: Tasting[] = [
    { id: 'a', whiskyId: 'seed-lagavulin-16', rating: 4, date: '2026-11-01' },
    { id: 'b', whiskyId: 'seed-glenfiddich-12', rating: 3, date: '2026-11-05' },
    { id: 'c', whiskyId: 'seed-lagavulin-16', rating: 5, date: '2026-11-07' },
  ];
  const s = recentShelf(ts, byId);
  assert.deepEqual(s.map((x) => x.w.id), ['seed-lagavulin-16', 'seed-glenfiddich-12']);
  assert.equal(s[0].count, 2);
  assert.equal(s[0].rating, 5);
});

test('다음 잔: 안 마신 위스키 중 취향에 가장 가까운 병, 취향 없으면 입문 병', () => {
  const smoky = byId.get('seed-lagavulin-16')!.flavor!;
  const pick = nextPick(smoky, all, new Set(['seed-lagavulin-16']))!;
  assert.notEqual(pick.w.id, 'seed-lagavulin-16');
  assert.ok(pick.w.peated, `${pick.w.id} 는 피트여야 함`);
  assert.match(pick.reason, /스모키/);
  assert.equal(nextPick(null, all, new Set())!.w.id, 'seed-glenfiddich-12');
});

test('다음 잔: 마신 병들의 가격대를 크게 넘는 병은 고르지 않는다', () => {
  const tried = new Set(['seed-lagavulin-16', 'seed-laphroaig-10', 'seed-ardbeg-10']);
  const taste = byId.get('seed-lagavulin-16')!.flavor!;
  const pick = nextPick(taste, all, tried)!;
  assert.ok((pick.w.price ?? 0) <= 27, `${pick.w.id} ${pick.w.price}만 원`);
});
