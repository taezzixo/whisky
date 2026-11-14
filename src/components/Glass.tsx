// 테이스팅 잔(글렌캐런형) 일러스트 — 실제 라벨·로고 대신 쓰는 도감의 기본 그림.
// 잔 속 색은 lib/liquid.ts 의 추정 액체 색. 안 마신 위스키는 빈 잔(점선)으로 그린다.

import { useId } from 'react';
import type { Whisky } from '../types.ts';
import { liquidColor } from '../lib/liquid.ts';

const OUTLINE = 'M13 4 L27 4 C27 10 33 16 33 26 C33 34 28 39 22 40 L22 50 C28 51 31 53 31 56 L9 56 C9 53 12 51 18 50 L18 40 C12 39 7 34 7 26 C7 16 13 10 13 4 Z';
const BOWL = 'M13.9 5 L26.1 5 C26.1 11 32 16.5 32 26 C32 33.4 27.4 38.1 20 38.1 C12.6 38.1 8 33.4 8 26 C8 16.5 13.9 11 13.9 5 Z';

interface Props {
  w: Pick<Whisky, 'casks' | 'age' | 'type' | 'abv'>;
  size?: number; // 높이(px)
  filled?: boolean; // false 면 빈 잔
  level?: number; // 0~1, 기본 0.55
}

export function Glass({ w, size = 64, filled = true, level = 0.55 }: Props) {
  const id = useId().replace(/:/g, '');
  const color = liquidColor(w);
  const top = 38.1 - (38.1 - 12) * level;
  const drop = filled ? 0 : 38.1 - top + 1; // 빈 잔은 액체를 잔 바닥 아래로 내려 둔다 → 채울 때 차오르는 움직임
  return (
    <svg className={`glass${filled ? '' : ' empty'}`} viewBox="0 0 40 60" width={(size * 40) / 60} height={size} aria-hidden="true">
      <defs>
        <clipPath id={`b${id}`}>
          <path d={BOWL} />
        </clipPath>
        <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.82" />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#b${id})`}>
        <rect className="liquid" x="0" y={top} width="40" height="40" fill={`url(#g${id})`} style={{ transform: `translateY(${drop}px)` }} />
        {filled && <ellipse cx="20" cy={top} rx="12" ry="1.1" fill={color} opacity="0.55" />}
      </g>
      <path className="outline" d={OUTLINE} />
      <path className="shine" d="M11.5 15 C10 19 9.6 24 10.4 29" />
    </svg>
  );
}
