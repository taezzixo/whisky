// 디자인 시스템 규칙: 테일윈드 대괄호 임의값(`p-[13px]`, `bg-[#fff]`, `[mask:..]`) 금지, 테마 토큰만 쓴다.
// className 문자열 안에서 "-[" 또는 "[" 로 시작하는 클래스를 찾는다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function files(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx|ts)$/.test(n) && !n.endsWith('.test.ts') ? [p] : [];
  });
}

export function arbitraryClasses(src) {
  const out = [];
  const re = /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g;
  for (const m of src.matchAll(re)) {
    const s = m[1] ?? m[2] ?? m[3] ?? '';
    for (const c of s.split(/\s+/)) if (/(^|[-:])\[/.test(c)) out.push(c);
  }
  return out;
}

test('임의값 검사기가 대괄호 클래스를 찾는다', () => {
  assert.deepEqual(arbitraryClasses('<a className="p-4 w-[13px] md:[mask:x]">'), ['w-[13px]', 'md:[mask:x]']);
  assert.deepEqual(arbitraryClasses('<a className={`gap-2 ${x}`}>'), []);
});

test('src 의 className 에 테일윈드 임의값이 없다', () => {
  const bad = [];
  for (const f of files('src')) for (const c of arbitraryClasses(readFileSync(f, 'utf8'))) bad.push(`${f}: ${c}`);
  assert.deepEqual(bad, []);
});

// 기존 CSS 클래스가 테일윈드 유틸리티 이름과 겹치면(예: .outline, .ring) 테일윈드 규칙이 덮어써 화면이 깨진다
const TW_WORDS = ['outline', 'ring', 'grid', 'flex', 'border', 'shadow', 'filter', 'table', 'transform', 'hidden', 'block', 'inline', 'contents', 'container', 'truncate', 'italic', 'underline', 'uppercase', 'static', 'fixed', 'absolute', 'relative', 'sticky', 'visible', 'invisible', 'rounded', 'blur', 'transition', 'grow', 'shrink'];
test('styles.css 클래스가 테일윈드 유틸리티 이름과 겹치지 않는다', () => {
  const css = readFileSync('src/styles.css', 'utf8');
  const hits = TW_WORDS.filter((c) => new RegExp(`\\.${c}(?![\\w-])`).test(css));
  assert.deepEqual(hits, []);
});
