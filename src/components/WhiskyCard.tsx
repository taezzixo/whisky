import type { Whisky } from '../types.ts';
import { TYPE_LABEL } from '../config/flavor.ts';
import { Bottle } from './Bottle.tsx';

export function priceText(w: Whisky): string {
  return w.price ? `약 ${w.price}만 원` : '';
}

export function specLine(w: Whisky): string {
  return [w.country, w.region, TYPE_LABEL[w.type], w.age ? `${w.age}년` : w.flavor ? 'NAS' : '', w.abv ? `${w.abv}%` : ''].filter(Boolean).join(' · ');
}

interface Props {
  w: Whisky;
  badge?: string;
  note?: string;
  chips?: string[];
  wished?: boolean;
  onWish?: () => void;
  onOpen: () => void;
}

export function WhiskyCard({ w, badge, note, chips, wished, onWish, onOpen }: Props) {
  return (
    <article className="wcard">
      <button className="wcard-main" onClick={onOpen} aria-label={`${w.nameKo ?? w.name} 상세 보기`}>
        <Bottle w={w} />
        <div className="wcard-body">
          {badge && <span className="badge">{badge}</span>}
          <h4>{w.nameKo ?? w.name}</h4>
          <p className="sub">{w.nameKo ? w.name : ''}</p>
          <p className="spec">{specLine(w)}</p>
          {w.tags && <p className="tags">{w.tags.map((t) => `#${t}`).join(' ')}</p>}
          {chips && chips.length > 0 && (
            <p className="chips">
              {chips.map((c) => (
                <span key={c} className="chip">
                  {c}
                </span>
              ))}
            </p>
          )}
          {note && <p className="note">{note}</p>}
          {!w.flavor && <p className="note muted">맛 정보 준비 중</p>}
        </div>
      </button>
      <div className="wcard-foot">
        <span className="price">{priceText(w)}</span>
        {onWish && (
          <button className={`wish${wished ? ' on' : ''}`} onClick={onWish} aria-pressed={wished}>
            {wished ? '♥ 위시' : '♡ 위시'}
          </button>
        )}
      </div>
    </article>
  );
}
