// 맛 지도 — 가로: 바디(가벼움 → 묵직함), 세로: 부드러움·과일 → 스모키.
// 점 색 = 추정 액체 색, 황동 테두리 = 마신 위스키, 청록 마름모 = 내 취향(시음 기록 또는 BTI).

import { useMemo, useState } from 'react';
import type { Whisky } from '../types.ts';
import { mapPoint } from '../lib/collection.ts';
import { LIQUID_RAMP, liquidColor } from '../lib/liquid.ts';

interface Props {
  dex: Whisky[];
  tried: Set<string>;
  me?: { taste: number[]; label: string } | null;
  onOpen: (id: string) => void;
}

const W = 760;
const H = 500;
const PAD = { l: 56, r: 24, t: 24, b: 48 };
const X0 = 0.5, X1 = 5.2; // 바디
const Y0 = -4.8, Y1 = 4.6; // 스모키 − (과일+단맛)/2 (시드 실측 범위 −4.5 ~ 3.5)

const sx = (x: number) => PAD.l + ((x - X0) / (X1 - X0)) * (W - PAD.l - PAD.r);
const sy = (y: number) => H - PAD.b - ((y - Y0) / (Y1 - Y0)) * (H - PAD.t - PAD.b);

/** id 로 정해지는 작은 흔들림 — 같은 좌표의 점이 겹치지 않게 */
function jitter(id: string, k: number): number {
  let h = k * 2654435761;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 2246822519);
  return ((h >>> 0) / 4294967295 - 0.5) * (k === 1 ? 0.8 : 0.5); // 바디는 정수 점수가 많아 가로로 더 넓게 흩뜨린다
}

const GROUPS: { id: string; label: string; test: (w: Whisky) => boolean }[] = [
  { id: 'all', label: '전체', test: () => true },
  { id: 'scotch', label: '스코틀랜드', test: (w) => w.country === '스코틀랜드' },
  { id: 'us', label: '미국', test: (w) => w.country === '미국' },
  { id: 'jp', label: '일본', test: (w) => w.country === '일본' },
  { id: 'ie', label: '아일랜드', test: (w) => w.country === '아일랜드' },
  { id: 'peat', label: '피트', test: (w) => !!w.peated },
  { id: 'tried', label: '마신 위스키', test: () => true },
];

export function FlavorMap({ dex, tried, me, onOpen }: Props) {
  const [group, setGroup] = useState('all');
  const [hover, setHover] = useState<{ w: Whisky; x: number; y: number } | null>(null);
  const pts = useMemo(
    () =>
      dex
        .filter((w) => w.flavor)
        .map((w) => {
          const p = mapPoint(w.flavor!);
          return { w, x: sx(p.x + jitter(w.id, 1)), y: sy(p.y + jitter(w.id, 2)) };
        }),
    [dex],
  );
  const g = GROUPS.find((x) => x.id === group)!;
  const inGroup = (w: Whisky) => (group === 'tried' ? tried.has(w.id) : g.test(w));
  const mePt = me ? mapPoint(me.taste) : null;
  const xTicks = [1, 2, 3, 4, 5];

  return (
    <div className="stack">
      <section className="hero">
        <h1>맛 지도</h1>
        <p className="lede">가벼운지 묵직한지, 과일 쪽인지 연기 쪽인지로 위스키 {pts.length}종을 펼쳤습니다. 점을 누르면 그 위스키로 갑니다.</p>
      </section>
      <section>
        <div className="chips" role="group" aria-label="보기">
          {GROUPS.map((x) => (
            <button key={x.id} className="chip" aria-pressed={group === x.id} onClick={() => setGroup(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
        <div className="map-wrap map" style={{ marginTop: 14 }}>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="맛 지도 산점도. 가로축 바디, 세로축 부드러움에서 스모키까지.">
            <rect className="frame" x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} rx="4" />
            <line className="axis" x1={sx(2.85)} x2={sx(2.85)} y1={PAD.t} y2={H - PAD.b} />
            <line className="axis" x1={PAD.l} x2={W - PAD.r} y1={sy(0)} y2={sy(0)} />
            <text className="quad" x={PAD.l + 12} y={PAD.t + 22}>가볍고 스모키</text>
            <text className="quad" x={W - PAD.r - 12} y={PAD.t + 22} textAnchor="end">묵직하고 스모키</text>
            <text className="quad" x={PAD.l + 12} y={H - PAD.b - 14}>가볍고 과일 향</text>
            <text className="quad" x={W - PAD.r - 12} y={H - PAD.b - 14} textAnchor="end">묵직하고 달콤함</text>
            {xTicks.map((t) => (
              <text key={t} className="axis-label" x={sx(t)} y={H - PAD.b + 18} textAnchor="middle">
                {t}
              </text>
            ))}
            <text className="axis-label" x={(PAD.l + W - PAD.r) / 2} y={H - 8} textAnchor="middle">
              바디: 가벼움 → 묵직함
            </text>
            <text className="axis-label" x={16} y={(PAD.t + H - PAD.b) / 2} textAnchor="middle" transform={`rotate(-90 16 ${(PAD.t + H - PAD.b) / 2})`}>
              부드러움·과일 → 스모키
            </text>
            {pts.map(({ w, x, y }) => {
              const on = inGroup(w);
              return (
                <g key={w.id}>
                  <circle
                    className={`pt${on ? '' : ' dim'}`}
                    cx={x}
                    cy={y}
                    r={on ? 6 : 4.5}
                    fill={liquidColor(w)}
                    onMouseEnter={() => setHover({ w, x, y })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => onOpen(w.id)}
                  >
                    <title>{w.nameKo ?? w.name}</title>
                  </circle>
                  {tried.has(w.id) && on && <circle className="tried-ring" cx={x} cy={y} r={9.5} />}
                </g>
              );
            })}
            {mePt && (
              <g>
                <rect className="me" x={sx(mePt.x) - 8} y={sy(mePt.y) - 8} width="16" height="16" transform={`rotate(45 ${sx(mePt.x)} ${sy(mePt.y)})`} />
                <text className="me-label" x={sx(mePt.x) + 14} y={sy(mePt.y) + 4}>
                  {me!.label}
                </text>
              </g>
            )}
          </svg>
          {hover && (
            <div className="map-tip" style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%` }}>
              {hover.w.nameKo ?? hover.w.name}
              {tried.has(hover.w.id) ? ', 기록함' : ''}
            </div>
          )}
        </div>
        <div className="map-legend">
          <span>
            <i style={{ background: `linear-gradient(90deg,${LIQUID_RAMP[0]},${LIQUID_RAMP[2]},${LIQUID_RAMP[5]})` }} />점 색: 추정 액체 색(캐스크·숙성)
          </span>
          <span>
            <i style={{ border: '2px solid var(--brass)', background: 'transparent' }} />황동 테두리: 내가 마신 위스키
          </span>
          {me && (
            <span>
              <i style={{ background: 'var(--series-2)', borderRadius: 2, transform: 'rotate(45deg)' }} />
              {me.label}의 위치
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
