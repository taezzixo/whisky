import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hasDutyFree, offerLines, shortPrice, sizeLabel } from './prices.ts';
import { searchWhiskies } from './overrides.ts';
import type { Whisky } from '../types.ts';

const all: Whisky[] = JSON.parse(readFileSync(new URL('../../data/flavor-seed.json', import.meta.url), 'utf8')).whiskies;
const W = (id: string) => all.find((w) => w.id === `seed-${id}`)!;

test('용량 표기', () => {
  assert.equal(sizeLabel(700), '700ml');
  assert.equal(sizeLabel(1000), '1L');
  assert.equal(sizeLabel(1750), '1.8L');
});

test('가격 줄: 국내 700ml → 국내 1L → 면세 순서', () => {
  const lines = offerLines(W('glenfiddich-12'));
  assert.deepEqual(lines.map((l) => `${l.where} ${l.ml}`), ['kr 700', 'kr 1000', 'dutyfree 1000']);
  assert.match(lines[2].text, /^약 \$\d+$/);
});

test('짧은 가격: 700ml 국내가가 없으면 다른 용량이나 면세가', () => {
  assert.equal(shortPrice(W('glenfiddich-12')), '약 7만 원');
  assert.equal(shortPrice(W('golden-blue-sapphire')), '약 3.5만 원(450ml)');
  assert.equal(shortPrice(W('macallan-quest')), '면세 약 $85(1L)');
  assert.equal(shortPrice({ price: undefined, prices: undefined }), '');
});

test('면세 여부', () => {
  assert.equal(hasDutyFree(W('talisker-dark-storm')), true);
  assert.equal(hasDutyFree(W('johnnie-walker-red')), true);
  assert.equal(hasDutyFree(W('kimchangsoo-single-malt')), false);
});

test('검색: 흔한 다른 표기·띄어쓰기·면세·용량', () => {
  const names = (q: string) => searchWhiskies(all, q, 50).map((w) => w.id);
  assert.ok(names('맥켈란 12').includes('seed-macallan-12-sherry-oak'));
  assert.ok(names('라프로이그').includes('seed-laphroaig-10'));
  assert.ok(names('보우모어').includes('seed-bowmore-12'));
  assert.ok(names('탈리스카 다크스톰').includes('seed-talisker-dark-storm'));
  assert.ok(names('조니 워커 블루').includes('seed-johnnie-walker-blue'));
  assert.ok(names('면세 맥캘란').includes('seed-macallan-quest'));
  assert.ok(names('글렌피딕 1리터').includes('seed-glenfiddich-12'));
  assert.ok(names('골든블루').length >= 2);
});
