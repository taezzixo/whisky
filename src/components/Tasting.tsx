// 시음 기록: 별점(0.5 단위) + 날짜 + 마신 방법 + 메모. 저장하면 잔이 채워진다.

import { useId, useState } from 'react';
import type { Whisky } from '../types.ts';
import { SERVE_LABEL, type Tasting } from '../lib/collection.ts';

const STAR = 'M12 2.2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.1l-5.9 3.1 1.2-6.5L2.5 9.1l6.6-.9z';

export function Stars({ value, onChange, readOnly = false }: { value: number; onChange?: (v: number) => void; readOnly?: boolean }) {
  const uid = useId().replace(/:/g, '');
  return (
    <span className="stars" role={readOnly ? 'img' : 'group'} aria-label={`별점 ${value}점`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        const star = (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <clipPath id={`s${uid}${i}`}>
                <rect x="0" y="0" width={24 * fill} height="24" />
              </clipPath>
            </defs>
            <path className="empty" d={STAR} />
            <path className="full" d={STAR} clipPath={`url(#s${uid}${i})`} />
          </svg>
        );
        if (readOnly) return <span key={i} style={{ width: 18, height: 18, display: 'inline-block' }}>{star}</span>;
        return (
          <button
            key={i}
            type="button"
            aria-label={`${i}점 (왼쪽 절반은 ${i - 0.5}점)`}
            onClick={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const half = e.clientX && e.clientX - r.left < r.width / 2;
              onChange?.(half ? i - 0.5 : i);
            }}
          >
            {star}
          </button>
        );
      })}
    </span>
  );
}

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

interface Props {
  w: Whisky;
  history: Tasting[];
  onSave: (t: Tasting) => void;
}

export function TastingForm({ w, history, onSave }: Props) {
  const [rating, setRating] = useState(0);
  const [date, setDate] = useState(today);
  const [serve, setServe] = useState<Tasting['serve'] | ''>('');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState('');

  const save = () => {
    if (!rating) return;
    onSave({ id: `t-${Date.now().toString(36)}`, whiskyId: w.id, rating, date, serve: serve || undefined, note: note.trim() || undefined });
    setSaved(`${date}의 ${rating}점 기록을 저장했습니다.`);
    setRating(0);
    setNote('');
  };

  return (
    <div className="tasting">
      <h3>시음 기록하기</h3>
      <div className="form-row">
        <Stars value={rating} onChange={setRating} />
        <label>
          별점
          <input
            id="tasting-rating"
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            aria-label="별점 (0.5 단위)"
          />
          <span className="num">{rating ? `${rating}점` : '선택 전'}</span>
        </label>
      </div>
      <div className="form-row">
        <label>
          날짜
          <input id="tasting-date" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value || today())} />
        </label>
        <label>
          마신 방법
          <select id="tasting-serve" value={serve} onChange={(e) => setServe(e.target.value as Tasting['serve'] | '')}>
            <option value="">선택 안 함</option>
            {Object.entries(SERVE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <textarea id="tasting-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="한 줄 메모 (예: 건포도 향이 길게 남음)" maxLength={300} aria-label="메모" />
      <div className="row">
        <button className="btn" onClick={save} disabled={!rating}>
          기록 저장
        </button>
        {!rating && <span className="muted small">별점을 고르면 저장할 수 있습니다.</span>}
      </div>
      {saved && (
        <p className="notice" role="status">
          {saved}
        </p>
      )}
      {history.length > 0 && (
        <div className="small muted">
          이 위스키 기록:{' '}
          {history
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((t) => `${t.date} ${t.rating}점`)
            .join(', ')}
        </div>
      )}
    </div>
  );
}
