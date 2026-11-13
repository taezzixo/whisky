import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildProfile, recommend, typeCode } from './bti.ts';
import { QUESTIONS } from '../config/bti.ts';
import type { Whisky } from '../types.ts';

const all: Whisky[] = JSON.parse(readFileSync(new URL('../../data/flavor-seed.json', import.meta.url), 'utf8')).whiskies;
const ans = (o: Record<string, number>) => o;

test('문항마다 보기 2개 이상, id 중복 없음', () => {
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length);
  assert.ok(QUESTIONS.every((q) => q.choices.length >= 2));
});

test('피트를 좋아하면 P 유형, 피트 위스키 추천', () => {
  const p = buildProfile(ans({ coffee: 1, smoke: 0, dessert: 3, spice: 0, body: 0, serve: 1, budget: 2, adventure: 0 }));
  assert.equal(p.code[0], 'P');
  const { picks } = recommend(p, all);
  assert.equal(picks.length, 3);
  assert.ok(picks.every((x) => x.whisky.peated), picks.map((x) => x.whisky.id).join(','));
  assert.ok(picks.every((x) => x.whisky.price! <= 20));
});

test('달콤한 셰리 취향 + 피트 싫음 → 피트 없는 셰리 계열', () => {
  const p = buildProfile(ans({ coffee: 3, smoke: 2, dessert: 0, spice: 2, body: 0, serve: 1, budget: 3, adventure: 1 }));
  assert.equal(p.code[0], 'C');
  assert.equal(p.code[3], 'S');
  const { picks } = recommend(p, all);
  assert.ok(picks.every((x) => !x.whisky.peated));
  assert.ok(picks.filter((x) => x.whisky.casks?.includes('sherry')).length >= 2, picks.map((x) => x.whisky.id).join(','));
});

test('하이볼·5만원 이하 → 예산 안, 브랜드 중복 없음, 한 단계 위 제시', () => {
  const p = buildProfile(ans({ coffee: 2, smoke: 2, dessert: 1, spice: 1, body: 3, serve: 0, budget: 0, adventure: 1 }));
  assert.ok(p.highball);
  const { picks, stepUp } = recommend(p, all);
  assert.ok(picks.every((x) => x.whisky.price! <= 5));
  assert.equal(new Set(picks.map((x) => x.whisky.brand)).size, picks.length);
  assert.ok(stepUp && stepUp.whisky.price! > 5);
});

test('typeCode 경계', () => {
  assert.equal(typeCode([2, 3, 3, 3, 2, 1, 2, 1, 3, 3]), 'PR-SX');
  assert.equal(typeCode([4, 0, 2, 1, 3, 2, 2, 3, 1, 0]), 'CL-BM');
});
