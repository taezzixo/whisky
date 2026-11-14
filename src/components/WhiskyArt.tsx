// 위스키 그림: 배경을 지운 병 사진이면 볼록한 유리병 효과, 일반 사진이면 사진, 없으면 추정 액체 색 잔 일러스트.
import type { CSSProperties } from 'react';
import type { Whisky } from '../types.ts';
import { Glass } from './Glass.tsx';

const BASE = import.meta.env.BASE_URL;

export function WhiskyArt({ w, height, tried = true, eager = false }: { w: Whisky; height: number; tried?: boolean; eager?: boolean }) {
  const name = w.nameKo ?? w.name;
  if (w.image?.cutout) {
    const src = `${BASE}${w.image.src}`;
    const ratio = w.image.w && w.image.h ? w.image.w / w.image.h : 0.32;
    const width = Math.round(height * ratio);
    // 병 모양 그대로 가리는 마스크: 음영·광택이 병 밖으로 번지지 않는다
    const style = { '--bottle': `url("${src}")`, width, height } as CSSProperties;
    return (
      <span className={`bottle${tried ? '' : ' dim'}`} style={style}>
        <img src={src} alt={`${name} 병`} width={width} height={height} loading={eager ? 'eager' : 'lazy'} decoding="async" />
        <span className="shade" aria-hidden="true" />
        <span className="gloss" aria-hidden="true" />
      </span>
    );
  }
  if (w.image)
    return (
      <img
        className="photo"
        src={`${BASE}${w.image.src}`}
        alt={`${name} 병 사진`}
        style={{ height, width: 'auto', maxWidth: '100%' }}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  return <Glass w={w} size={height * 0.86} filled={tried} />;
}

/** 진열 칸 3D 기울기: 포인터 위치에 따라 최대 8도 */
export function tiltHandlers() {
  return {
    onPointerMove(e: React.PointerEvent<HTMLElement>) {
      if (e.pointerType !== 'mouse') return;
      const r = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      e.currentTarget.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
      e.currentTarget.style.setProperty('--rx', `${(-y * 9).toFixed(2)}deg`);
      e.currentTarget.style.setProperty('--gx', `${(50 + x * 60).toFixed(1)}%`); // 광택이 포인터를 따라 움직임
    },
    onPointerLeave(e: React.PointerEvent<HTMLElement>) {
      e.currentTarget.style.setProperty('--ry', '0deg');
      e.currentTarget.style.setProperty('--rx', '0deg');
      e.currentTarget.style.removeProperty('--gx');
    },
  };
}
