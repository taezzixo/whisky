// 맛 차트: 레이더(최대 2개 겹쳐 보기) + 10축 막대(표 보기 겸용).
// 색은 styles.css 의 --series-1/--series-2 만 쓴다 (검증된 팔레트). 두 번째 계열은 점선으로도 구분한다.

import { useState } from 'react';
import { AXES, RADAR_AXES, AXIS_INDEX } from '../config/flavor.ts';

export interface Series {
  label: string;
  values: number[]; // 10축 전체
}

const MAX = 5;

export function Radar({ series, size = 260, axes = RADAR_AXES }: { series: Series[]; size?: number; axes?: readonly (keyof typeof AXIS_INDEX)[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const pad = 46;
  const r = size / 2 - pad;
  const cx = size / 2;
  const cy = size / 2;
  const n = axes.length;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [cx + Math.cos(a) * r * (v / MAX), cy + Math.sin(a) * r * (v / MAX)] as const;
  };
  const label = (k: string) => AXES[AXIS_INDEX[k as keyof typeof AXIS_INDEX]].label;
  const shown = series.slice(0, 2);

  return (
    <figure className="radar">
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img" aria-label={`맛 레이더: ${shown.map((s) => s.label).join(', ')}`}>
        {[1, 2, 3, 4, 5].map((lv) => (
          <polygon key={lv} className="radar-grid" points={axes.map((_, i) => pt(i, lv).join(',')).join(' ')} />
        ))}
        {axes.map((k, i) => {
          const [x, y] = pt(i, MAX);
          const [lx, ly] = pt(i, MAX + 1.15);
          return (
            <g key={k}>
              <line className="radar-grid" x1={cx} y1={cy} x2={x} y2={y} />
              <text className="radar-axis" x={lx} y={ly} textAnchor={Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end'} dominantBaseline="middle">
                {label(k)}
              </text>
            </g>
          );
        })}
        {shown.map((s, si) => (
          <polygon
            key={s.label}
            className={`radar-area s${si + 1}`}
            points={axes.map((k, i) => pt(i, s.values[AXIS_INDEX[k]] ?? 0).join(',')).join(' ')}
          />
        ))}
        {shown.map((s, si) =>
          axes.map((k, i) => {
            const [x, y] = pt(i, s.values[AXIS_INDEX[k]] ?? 0);
            return <circle key={`${si}-${k}`} className={`radar-dot s${si + 1}`} cx={x} cy={y} r={4} />;
          }),
        )}
        {/* 마커보다 큰 hover 영역 */}
        {axes.map((k, i) => {
          const [x, y] = pt(i, 3.2);
          return (
            <circle
              key={`hit-${k}`}
              cx={x}
              cy={y}
              r={size / 7}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onTouchStart={() => setHover(i)}
            />
          );
        })}
      </svg>
      <div className="radar-tip" aria-live="polite">
        {hover != null ? (
          <>
            <b>{label(axes[hover])}</b>
            {shown.map((s, si) => (
              <span key={s.label} className="tip-row">
                <i className={`key s${si + 1}`} />
                {s.label} {(s.values[AXIS_INDEX[axes[hover]]] ?? 0).toFixed(1)}
              </span>
            ))}
          </>
        ) : (
          <span className="muted">축에 마우스를 올리면 수치가 보여요</span>
        )}
      </div>
      {shown.length > 1 && (
        <figcaption className="legend">
          {shown.map((s, si) => (
            <span key={s.label}>
              <i className={`key s${si + 1}`} /> {s.label}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}

/** 10축 전체 수치 — 차트의 표 보기 역할 */
export function FlavorBars({ values }: { values: number[] }) {
  return (
    <table className="flavor-bars">
      <caption className="sr-only">맛 10축 수치 (0~5)</caption>
      <tbody>
        {AXES.map((a, i) => (
          <tr key={a.key}>
            <th scope="row">{a.label}</th>
            <td>
              <span className="bar" style={{ width: `${((values[i] ?? 0) / MAX) * 100}%` }} />
            </td>
            <td className="num">{(values[i] ?? 0).toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
