#!/usr/bin/env node
// 키·네트워크 없이 화면을 띄우기 위한 샘플 데이터: 시드만으로 public/data 를 만든다.
// 실제 수집(npm run fetch:data)이 돌면 이 파일들은 덮어써진다.
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

import { attachImages } from './lib/images.mjs';
const images = existsSync('data/images.json') ? JSON.parse(await readFile('data/images.json', 'utf8')) : null;
const seed = attachImages(JSON.parse(await readFile('data/flavor-seed.json', 'utf8')).whiskies, images);
const generatedAt = new Date().toISOString();
await writeFile('public/data/whiskies.json', JSON.stringify({ generatedAt, sample: true, sources: [{ id: 'seed', ok: true, count: seed.length }], whiskies: seed }));
if (!existsSync('public/data/catalog.json')) await writeFile('public/data/catalog.json', JSON.stringify({ generatedAt, items: [] }));
if (!existsSync('public/data/distilleries.json')) await writeFile('public/data/distilleries.json', JSON.stringify({ generatedAt, items: [] }));
if (!existsSync('public/data/overrides.json')) await writeFile('public/data/overrides.json', JSON.stringify({ hide: [], patch: {}, manual: [] }, null, 2) + '\n');
if (!existsSync('public/data/run-log.json')) await writeFile('public/data/run-log.json', JSON.stringify({ last: null, history: [] }, null, 1));
console.log(`샘플: 시드 ${seed.length}종 → public/data/whiskies.json`);
