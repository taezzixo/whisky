import type { ReactNode } from 'react';
import type { Whisky } from '../types.ts';
import { CASK_LABEL, TYPE_LABEL } from '../config/flavor.ts';
import { WhiskyArt } from './WhiskyArt.tsx';

/** "스코틀랜드 스페이사이드, 싱글몰트, 12년, 40%" */
export function specLine(w: Whisky): string {
  const place = [w.country, w.region].filter(Boolean).join(' ');
  const age = w.age ? `${w.age}년` : w.flavor ? '숙성 연수 미표기' : '';
  return [place, TYPE_LABEL[w.type], age, w.abv ? `${w.abv}%` : ''].filter(Boolean).join(', ');
}

export function caskLine(w: Whisky): string {
  return (w.casks ?? []).map((c) => CASK_LABEL[c]).join(', ');
}

export const priceText = (w: Whisky) => (w.price ? `약 ${w.price}만 원` : '');

interface Props {
  w: Whisky;
  tried?: boolean;
  score?: string; // 오른쪽 수치 (적합도·유사도)
  why?: ReactNode; // 추천 이유
  wished?: boolean;
  onWish?: () => void;
  onOpen: () => void;
}

export function WhiskyRow({ w, tried = true, score, why, wished, onWish, onOpen }: Props) {
  return (
    <article className={`wrow${tried ? '' : ' untried'}`}>
      <span className="thumb">
        <WhiskyArt w={w} height={66} tried={tried} />
      </span>
      <button className="main" onClick={onOpen}>
        <h4>{w.nameKo ?? w.name}</h4>
        {w.nameKo && <span className="en">{w.name}</span>}
        <span className="spec">{specLine(w)}</span>
        {w.tags && <span className="tag-line">{w.tags.join(', ')}</span>}
        {why && <span className="why">{why}</span>}
        {!w.flavor && <span className="why muted">맛 정보 준비 중</span>}
      </button>
      <div className="side">
        {score && <span className="score">{score}</span>}
        {w.price ? <span className="price">{priceText(w)}</span> : null}
        {onWish && (
          <button className="wish" onClick={onWish} aria-pressed={!!wished}>
            {wished ? '위시에 담음' : '위시 담기'}
          </button>
        )}
      </div>
    </article>
  );
}
