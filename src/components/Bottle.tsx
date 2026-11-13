// 템플릿 바틀 일러스트 — 실제 라벨·로고 대신 병 모양 템플릿 + 색 조합 (저작권 회피, 도감 통일감).

import type { Whisky } from '../types.ts';

const LIQUID: Record<string, string> = {
  sherry: '#8a3b12',
  wine: '#7a2a1e',
  port: '#6e2433',
  rum: '#b0601a',
  mizunara: '#b5741c',
  bourbon: '#c98a2b',
  'virgin-oak': '#b8661e',
};

function hue(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function Bottle({ w, size = 56 }: { w: Whisky; size?: number }) {
  const cask = w.casks?.find((c) => c === 'sherry' || c === 'wine' || c === 'port') ?? w.casks?.[0] ?? 'bourbon';
  const liquid = LIQUID[cask] ?? '#c98a2b';
  const label = `hsl(${hue(w.brand ?? w.name)} 35% 88%)`;
  const ink = `hsl(${hue(w.brand ?? w.name)} 45% 28%)`;
  const square = ['bourbon', 'tennessee', 'rye'].includes(w.type);
  const short = w.type === 'blended' || w.type === 'grain';
  const body = square
    ? 'M14 30 h28 a4 4 0 0 1 4 4 v54 a6 6 0 0 1 -6 6 h-24 a6 6 0 0 1 -6 -6 v-54 a4 4 0 0 1 4 -4z'
    : short
      ? 'M22 18 h12 v10 c10 4 14 10 14 18 v42 a6 6 0 0 1 -6 6 h-28 a6 6 0 0 1 -6 -6 v-42 c0 -8 4 -14 14 -18z'
      : 'M23 6 h10 v18 c8 4 12 9 12 16 v48 a6 6 0 0 1 -6 6 h-22 a6 6 0 0 1 -6 -6 v-48 c0 -7 4 -12 12 -16z';
  const initials = (w.brand ?? w.name).replace(/^The /, '').slice(0, 2).toUpperCase();
  return (
    <svg className="bottle" viewBox="0 0 56 100" width={size * 0.56} height={size} aria-hidden="true">
      <path d={body} fill={liquid} opacity="0.92" />
      {square ? <rect x="20" y="16" width="16" height="14" rx="2" fill="#2b2118" /> : <rect x="22" y={short ? 10 : 0} width="12" height="8" rx="2" fill="#2b2118" />}
      <rect x="13" y="52" width="30" height="24" rx="3" fill={label} />
      <text x="28" y="68" textAnchor="middle" fontSize="10" fontWeight="700" fill={ink} fontFamily="Georgia, serif">
        {initials}
      </text>
      {w.peated && <circle cx="28" cy="84" r="3" fill="#3d3d3d" />}
    </svg>
  );
}
