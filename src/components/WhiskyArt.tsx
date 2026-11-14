// 위스키 그림: 실제 사진(Open Food Facts, CC BY-SA)이 있으면 사진, 없으면 추정 액체 색 잔 일러스트.
import type { Whisky } from '../types.ts';
import { Glass } from './Glass.tsx';

const BASE = import.meta.env.BASE_URL;

export function WhiskyArt({ w, height, tried = true, eager = false }: { w: Whisky; height: number; tried?: boolean; eager?: boolean }) {
  if (w.image)
    return (
      <img
        className="photo"
        src={`${BASE}${w.image.src}`}
        alt={`${w.nameKo ?? w.name} 병 사진`}
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
      e.currentTarget.style.setProperty('--ry', `${(x * 16).toFixed(2)}deg`);
      e.currentTarget.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`);
    },
    onPointerLeave(e: React.PointerEvent<HTMLElement>) {
      e.currentTarget.style.setProperty('--ry', '0deg');
      e.currentTarget.style.setProperty('--rx', '0deg');
    },
  };
}
