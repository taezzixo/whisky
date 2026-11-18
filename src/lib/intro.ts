// 첫 화면 연출 (Anime.js): 로고 글자가 차례로 떠오르고, 도감 색 띠가 가운데부터 차오른다.
// 방문(탭 세션)마다 한 번만, 움직임 줄이기 설정이면 하지 않는다.
import { animate } from 'animejs/animation';
import { stagger } from 'animejs/utils';

const KEY = 'whisky-dex:intro:';

export const prefersReducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 이번 세션에 처음이면 true (그리고 표시해 둔다) */
function firstTime(part: string): boolean {
  try {
    if (sessionStorage.getItem(KEY + part)) return false;
    sessionStorage.setItem(KEY + part, '1');
  } catch {
    /* 저장이 막힌 환경에서는 매번 연출 */
  }
  return true;
}

export function playWordmark(el: HTMLElement | null) {
  if (!el || prefersReducedMotion() || !firstTime('logo')) return;
  animate(el.querySelectorAll('.ch'), { opacity: [0, 1], y: ['0.5em', '0em'], delay: stagger(55), duration: 700, ease: 'outExpo' });
  const dot = el.querySelector('i');
  if (dot) animate(dot, { scale: [0, 1], delay: 520, duration: 600, ease: 'outBack(3)' });
}

export function playBand(el: HTMLElement | null) {
  if (!el || prefersReducedMotion() || !firstTime('band')) return;
  const bars = el.querySelectorAll('span');
  const step = Math.max(1, Math.round(900 / Math.max(1, bars.length / 2)));
  animate(bars, { scaleY: [0, 1], delay: stagger(step, { from: 'center' }), duration: 900, ease: 'outExpo' });
}
