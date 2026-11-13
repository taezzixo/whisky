// 위스키 상세 + 비슷한 위스키 추천 (모드: 비슷한 / 더 저렴한 / 한 단계 위 / 한 축만 바꾸기)

import { useMemo, useState } from 'react';
import { AXES, CASK_LABEL, GRADE_LABEL, type AxisKey } from '../config/flavor.ts';
import { findSimilar, type SimilarMode } from '../lib/similar.ts';
import type { Whisky } from '../types.ts';
import { Bottle } from './Bottle.tsx';
import { FlavorBars, Radar } from './Charts.tsx';
import { priceText, specLine, WhiskyCard } from './WhiskyCard.tsx';

interface Props {
  w: Whisky;
  all: Whisky[];
  wishlist: string[];
  tried: string[];
  onWish: (id: string) => void;
  onTried: (id: string) => void;
  onOpen: (id: string) => void;
  onBack: () => void;
}

const MODES: { id: SimilarMode; label: string }[] = [
  { id: 'similar', label: '비슷한' },
  { id: 'cheaper', label: '더 저렴한 대체' },
  { id: 'upgrade', label: '한 단계 위' },
  { id: 'shift', label: '한 축만 바꾸기' },
];

const SOURCE_LABEL = { seed: '큐레이션 시드', wikidata: 'Wikidata', off: 'Open Food Facts', iowa: 'Iowa 주류청', manual: '수동 등록' } as const;

export function WhiskyDetail({ w, all, wishlist, tried, onWish, onTried, onOpen, onBack }: Props) {
  const [mode, setMode] = useState<SimilarMode>('similar');
  const [axis, setAxis] = useState<AxisKey>('smoky');
  const [delta, setDelta] = useState(2);
  const [compare, setCompare] = useState<string | null>(null);
  const excludeTried = useMemo(() => new Set(tried), [tried]);
  const [hideTried, setHideTried] = useState(false);

  const results = useMemo(
    () => findSimilar(w, all, { mode, shift: { axis, delta }, limit: 6, exclude: hideTried ? excludeTried : undefined }),
    [w, all, mode, axis, delta, hideTried, excludeTried],
  );
  const cmp = compare ? all.find((x) => x.id === compare) : undefined;
  const name = w.nameKo ?? w.name;

  return (
    <section className="detail">
      <button className="link" onClick={onBack}>
        ← 목록으로
      </button>
      <div className="card detail-head">
        <Bottle w={w} size={120} />
        <div>
          <p className="eyebrow">
            데이터 등급 {w.grade} · {GRADE_LABEL[w.grade]}
          </p>
          <h2>{name}</h2>
          {w.nameKo && <p className="sub">{w.name}</p>}
          <p className="spec">{specLine(w)}</p>
          {w.casks && <p className="spec">캐스크: {w.casks.map((c) => CASK_LABEL[c]).join(' · ')}{w.peated ? ' · 피트' : ''}</p>}
          {w.tags && <p className="tags">{w.tags.map((t) => `#${t}`).join(' ')}</p>}
          {w.summary && <p>{w.summary}</p>}
          <p className="price">
            {priceText(w)} {w.price && <span className="muted small">(참고 가격, 700ml)</span>}
          </p>
          <div className="row">
            <button className={`btn${wishlist.includes(w.id) ? '' : ' ghost'}`} onClick={() => onWish(w.id)} aria-pressed={wishlist.includes(w.id)}>
              {wishlist.includes(w.id) ? '♥ 위시리스트에 있음' : '♡ 위시리스트 담기'}
            </button>
            <button className={`btn${tried.includes(w.id) ? '' : ' ghost'}`} onClick={() => onTried(w.id)} aria-pressed={tried.includes(w.id)}>
              {tried.includes(w.id) ? '✓ 마셔봤어요' : '마셔봤어요'}
            </button>
          </div>
        </div>
      </div>

      {w.flavor ? (
        <div className="card flavor">
          <div>
            <h3>맛 프로필</h3>
            <Radar series={[{ label: name, values: w.flavor }, ...(cmp?.flavor ? [{ label: cmp.nameKo ?? cmp.name, values: cmp.flavor }] : [])]} />
            {cmp && (
              <button className="link" onClick={() => setCompare(null)}>
                비교 끄기
              </button>
            )}
          </div>
          <FlavorBars values={w.flavor} />
        </div>
      ) : (
        <div className="card muted">이 위스키는 아직 맛 정보가 없어요. 수집 카탈로그에서 온 항목입니다.</div>
      )}

      {w.flavor && (
        <div className="similar">
          <h3>비슷한 위스키 추천</h3>
          <div className="tabs" role="tablist">
            {MODES.map((m) => (
              <button key={m.id} role="tab" aria-selected={mode === m.id} className={mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          {mode === 'shift' && (
            <div className="shift row">
              <label>
                바꿀 맛
                <select value={axis} onChange={(e) => setAxis(e.target.value as AxisKey)}>
                  {AXES.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {delta > 0 ? '더' : '덜'} ({delta > 0 ? '+' : ''}
                {delta})
                <input type="range" min={-3} max={3} step={1} value={delta} onChange={(e) => setDelta(Number(e.target.value) || 1)} />
              </label>
            </div>
          )}
          <label className="small muted">
            <input type="checkbox" checked={hideTried} onChange={(e) => setHideTried(e.target.checked)} /> 마셔본 위스키 빼기
          </label>
          {results.length === 0 ? (
            <p className="muted">조건에 맞는 위스키가 아직 도감에 없어요. {w.price ? '' : '(가격 정보가 없으면 가격 비교 모드는 비어 있어요)'}</p>
          ) : (
            <div className="grid">
              {results.map((r) => (
                <WhiskyCard
                  key={r.whisky.id}
                  w={r.whisky}
                  badge={`유사도 ${Math.round(r.score * 100)}%`}
                  chips={r.common}
                  note={r.diff ? `차이: ${r.diff}` : undefined}
                  wished={wishlist.includes(r.whisky.id)}
                  onWish={() => onWish(r.whisky.id)}
                  onOpen={() => {
                    setCompare(null);
                    onOpen(r.whisky.id);
                  }}
                />
              ))}
            </div>
          )}
          {results.length > 0 && (
            <p className="small">
              레이더에 겹쳐 보기:{' '}
              {results.slice(0, 4).map((r) => (
                <button key={r.whisky.id} className={`chip btnchip${compare === r.whisky.id ? ' on' : ''}`} onClick={() => setCompare(compare === r.whisky.id ? null : r.whisky.id)}>
                  {r.whisky.nameKo ?? r.whisky.name}
                </button>
              ))}
            </p>
          )}
        </div>
      )}

      <p className="muted small">
        출처: {[...new Set([w.source, ...(w.refs ?? []).map((r) => r.source)])].map((s) => SOURCE_LABEL[s]).join(', ')}. 맛 수치·가격은 추정치이며 참고용입니다.
      </p>
    </section>
  );
}
