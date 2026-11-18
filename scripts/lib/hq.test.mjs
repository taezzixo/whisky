import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expressionTokens, hqCandidates, hqDownloadUrl, hqQuality, hqQueries, hqQueue, hqTitleOk } from './hq.mjs';

const dal = { id: 'seed-dalwhinnie-15', name: 'Dalwhinnie 15 Year Old', brand: 'Dalwhinnie', age: 15 };

test('hqTitleOk: 브랜드·연수가 맞는 단독 병 제목만', () => {
  assert.equal(hqTitleOk(dal, 'File:Dalwhinnie Single Highland Malt 15 years old.jpg'), true);
  assert.equal(hqTitleOk(dal, 'File:Dalwhinnie 25 years old.jpg'), false); // 다른 연수
  assert.equal(hqTitleOk(dal, 'File:Dalwhinnie Distillery 15.jpg'), false); // 증류소 사진
  assert.equal(hqTitleOk(dal, 'File:Dalwhinnie 15 gift box.jpg'), false); // 상자
  assert.equal(hqTitleOk(dal, 'File:Talisker 10 grau leer.jpg'), false); // 다른 브랜드
});

test('hqTitleOk: 연수 없는 위스키는 제품 고유 낱말까지 맞아야', () => {
  const ugy = { id: 'seed-ardbeg-uigeadail', name: 'Ardbeg Uigeadail', brand: 'Ardbeg' };
  assert.deepEqual(expressionTokens(ugy), ['uigeadail']);
  assert.equal(hqTitleOk(ugy, 'File:Ardbeg Uigeadail bottle.jpg'), true);
  assert.equal(hqTitleOk(ugy, 'File:Ardbeg (9860725873).jpg'), false); // 브랜드만 같은 다른 병일 수 있음
  const abu = { id: 'seed-aberlour-abunadh', name: "Aberlour A'bunadh", brand: 'Aberlour' };
  assert.equal(hqTitleOk(abu, 'File:Aberlour Abunadh Highland Single Malt Whisky Cask Strength (14596952096).jpg'), true);
});

test('hqQueue: 사용자 캡처 → 배경 있는 사진 → 사진 없음, 고화질·최근 실패는 뺀다', () => {
  const seed = ['a', 'b', 'c', 'd', 'e', 'f'].map((x) => ({ id: x, name: x }));
  seed[5].price = 7; // 가격 있는 병은 같은 순위에서 앞으로
  const db = {
    images: {
      a: { credit: 'Open Food Facts 기여자' }, // 배경 있는 사진
      b: { credit: '사용자 제공 이미지', cutout: true },
      c: { hq: true, cutout: true },
    },
    hq: { misses: { d: new Date().toISOString().slice(0, 10) } },
  };
  assert.deepEqual(hqQueue(seed, db).map((w) => w.id), ['b', 'a', 'f', 'e']);
  const old = { ...db, hq: { misses: { d: '2020-01-01' } } };
  assert.ok(hqQueue(seed, old).some((w) => w.id === 'd')); // 30일 지나면 다시
});

test('hqQueries: 브랜드+연수, 전체 이름 (중복 없이)', () => {
  assert.deepEqual(hqQueries(dal), ['Dalwhinnie 15', 'Dalwhinnie 15 Year Old']);
  assert.deepEqual(hqQueries({ name: 'Ardbeg Uigeadail', brand: 'Ardbeg' }), ['Ardbeg Uigeadail']);
});

test('hqCandidates: 자유 라이선스·세로 고해상도·제외 목록', () => {
  const page = (title, w, h, lic = 'CC BY-SA 3.0', mime = 'image/jpeg') => ({ title, imageinfo: [{ width: w, height: h, mime, url: 'u', extmetadata: { LicenseShortName: { value: lic } } }] });
  const pages = [
    page('File:Dalwhinnie 15 years old.jpg', 921, 1978),
    page('File:Dalwhinnie 15 big.jpg', 2000, 4000),
    page('File:Dalwhinnie 15 small.jpg', 300, 900), // 너무 작음
    page('File:Dalwhinnie 15 wide.jpg', 2000, 2200), // 가로로 넓음
    page('File:Dalwhinnie 15 nc.jpg', 900, 2000, 'CC BY-NC 2.0'), // 비상업 제한
    page('File:Dalwhinnie 15 rejected.jpg', 900, 2000),
  ];
  const got = hqCandidates(dal, pages, ['File:Dalwhinnie 15 rejected.jpg']).map((c) => c.title);
  assert.deepEqual(got, ['File:Dalwhinnie 15 big.jpg', 'File:Dalwhinnie 15 years old.jpg']);
});

test('hqDownloadUrl: 1280px보다 크면 표준 1280px 판', () => {
  const url = 'https://upload.wikimedia.org/wikipedia/commons/5/58/The_Glenlivet.JPG?utm_source=x';
  assert.equal(hqDownloadUrl({ url, width: 2004 }), 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/The_Glenlivet.JPG/1280px-The_Glenlivet.JPG');
  assert.equal(hqDownloadUrl({ url, width: 921 }), 'https://upload.wikimedia.org/wikipedia/commons/5/58/The_Glenlivet.JPG');
});

test('hqQuality: 병 1개·반사광·잘림·채움 검사', () => {
  const good = { objects: 1, glare: 0.1, sheen: 0.3, srcH: 1620, ratio: 0.27, edge: false, fill: 0.7, coverage: 0.3 };
  assert.equal(hqQuality(good).ok, true);
  assert.deepEqual(hqQuality({ ...good, objects: 2 }).why, ['덩어리 2개']);
  assert.equal(hqQuality({ ...good, glare: 4.2 }).ok, false); // 햇빛에 날아감
  assert.equal(hqQuality({ ...good, glare: 1.8, sheen: 13 }).ok, false); // 창문 반사(아벨라워 사례)
  assert.equal(hqQuality({ ...good, glare: 0.67, sheen: 1.06 }).ok, true); // 달위니 15년 실제 값
  assert.equal(hqQuality({ ...good, glare: 0.44, sheen: 1.22 }).ok, false); // 천장 조명이 비친 아벨라워 실제 값
  assert.equal(hqQuality({ ...good, edge: true }).ok, false); // 잘린 병
  assert.equal(hqQuality({ ...good, ratio: 0.9 }).ok, false); // 상자 옆 병 등
  assert.equal(hqQuality({ ...good, coverage: 0.95 }).ok, false); // 배경 제거 실패
});
