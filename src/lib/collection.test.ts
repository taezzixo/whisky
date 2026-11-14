import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { badgeStates, byCountry, collectionRate, mapPoint, tasteFromTastings, triedIds, type Tasting } from './collection.ts';
import { liquidColor, liquidScore } from './liquid.ts';
import { emptyData, mergeUserData, parseUserData, removeTasting, upsertTasting } from './store.ts';
import type { Whisky } from '../types.ts';

const all: Whisky[] = JSON.parse(readFileSync(new URL('../../data/flavor-seed.json', import.meta.url), 'utf8')).whiskies;
const byId = new Map(all.map((w) => [w.id, w]));
const W = (id: string) => byId.get(`seed-${id}`)!;
const t = (id: string, whisky: string, rating: number, date = '2026-11-01'): Tasting => ({ id, whiskyId: `seed-${whisky}`, rating, date });

test('액체 색: 셰리·숙성일수록 짙고, 결과는 hex', () => {
  assert.ok(liquidScore(W('macallan-18-sherry-oak')) > liquidScore(W('glenfiddich-12')));
  assert.ok(liquidScore(W('glendronach-21')) > liquidScore(W('jameson')));
  assert.match(liquidColor(W('lagavulin-16')), /^#[0-9a-f]{6}$/);
  for (const w of all) assert.ok(liquidScore(w) >= 0 && liquidScore(w) <= 5, w.id);
});

test('수집률·나라별 현황', () => {
  const tried = triedIds(['seed-jameson'], [t('a', 'laphroaig-10', 4)]);
  const r = collectionRate(all, tried);
  assert.equal(r.done, 2);
  assert.equal(r.total, all.length);
  const sc = byCountry(all, tried).find((c) => c.country === '스코틀랜드')!;
  assert.equal(sc.done, 1);
});

test('배지: 아일라 5종이면 아일라 순례자 획득', () => {
  const islay = ['laphroaig-10', 'ardbeg-10', 'lagavulin-16', 'bowmore-12', 'caol-ila-12'].map(W);
  const s = badgeStates(islay);
  assert.equal(s.find((b) => b.badge.id === 'islay')!.earned, true);
  assert.equal(s.find((b) => b.badge.id === 'peat')!.earned, true);
  assert.equal(s.find((b) => b.badge.id === 'ten')!.earned, false);
  assert.equal(s.find((b) => b.badge.id === 'ten')!.count, 5);
});

test('취향 벡터: 높은 별점의 위스키 쪽으로 기운다, 같은 위스키는 최근 기록만', () => {
  const v = tasteFromTastings([t('1', 'laphroaig-10', 5), t('2', 'glenfiddich-12', 3)], byId)!;
  assert.ok(v[1] > 3.5, `스모키 ${v[1]}`);
  const v2 = tasteFromTastings([t('1', 'laphroaig-10', 5, '2026-01-01'), t('2', 'laphroaig-10', 1, '2026-02-01'), t('3', 'glenfiddich-12', 5)], byId)!;
  assert.ok(v2[1] < 1, `최근 낮은 별점 반영: 스모키 ${v2[1]}`);
  assert.equal(tasteFromTastings([], byId), null);
});

test('맛 지도 좌표: 피트는 위, 과일·단맛은 아래', () => {
  assert.ok(mapPoint(W('laphroaig-10').flavor!).y > mapPoint(W('glenfiddich-12').flavor!).y);
  assert.ok(mapPoint(W('aberlour-abunadh').flavor!).x > mapPoint(W('jameson').flavor!).x);
});

test('시음 기록 저장: 추가·수정·삭제·가져오기 병합·잘못된 값 거름', () => {
  let d = upsertTasting(emptyData(), t('x', 'jameson', 4));
  d = upsertTasting(d, { ...t('x', 'jameson', 4.5) });
  assert.equal(d.tastings.length, 1);
  assert.equal(d.tastings[0].rating, 4.5);
  assert.equal(removeTasting(d, 'x').tastings.length, 0);
  const m = mergeUserData(d, { ...emptyData(), tastings: [t('y', 'ardbeg-10', 3)] });
  assert.equal(m.tastings.length, 2);
  const p = parseUserData({ tastings: [t('ok', 'jameson', 3), { id: 'bad', whiskyId: 'x', rating: 9, date: '2026-01-01' }, { id: 'bad2' }] });
  assert.deepEqual(p.tastings.map((x) => x.id), ['ok']);
  assert.deepEqual(parseUserData({ wishlist: ['a'] }).tastings, []); // 예전 저장값과 호환
});
