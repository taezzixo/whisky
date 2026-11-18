// 위스키 상세 — 큰 잔(추정 액체 색), 정보, 시음 기록, 맛 프로필, 비슷한 위스키 4가지 모드

import { useMemo, useState } from 'react';
import { AXES, GRADE_LABEL, type AxisKey } from '../config/flavor.ts';
import type { Tasting } from '../lib/collection.ts';
import { liquidName } from '../lib/liquid.ts';
import { findSimilar, type SimilarMode } from '../lib/similar.ts';
import type { Whisky } from '../types.ts';
import { FlavorBars } from './Charts.tsx';
import { FlavorRadar } from './FlavorRadar.tsx';
import { WhiskyArt } from './WhiskyArt.tsx';
import { pairingGuide } from '../lib/pairing.ts';
import { TastingForm } from './Tasting.tsx';
import { TastingCard } from './TastingCard.tsx';
import { offerLines, sizeLabel } from '../lib/prices.ts';
import { slugify } from '../lib/insights.ts';
import { AppLink } from './ui.tsx';
import { caskLine, WhiskyRow } from './WhiskyRow.tsx';
import { TYPE_LABEL } from '../config/flavor.ts';

interface Props {
  w: Whisky;
  all: Whisky[];
  wishlist: string[];
  tried: Set<string>;
  tastings: Tasting[];
  onWish: (id: string) => void;
  onToggleTried: (id: string) => void;
  inCompare: boolean;
  compareFull: boolean;
  onToggleCompare: (id: string) => void;
  inBar: boolean;
  onAddToBar: (id: string) => void;
  onSaveTasting: (t: Tasting) => void;
  onOpen: (id: string) => void;
  onBack: () => void;
  onDistillery?: (slug: string) => void;
}

const MODES: { id: SimilarMode; label: string }[] = [
  { id: 'similar', label: '비슷한' },
  { id: 'cheaper', label: '더 저렴한 대체' },
  { id: 'upgrade', label: '한 단계 위' },
  { id: 'shift', label: '한 가지 맛만 바꾸기' },
];

const SOURCE_LABEL = { seed: '큐레이션 시드', wikidata: 'Wikidata', off: 'Open Food Facts', iowa: '아이오와 주류청', manual: '수동 등록' } as const;

export function WhiskyDetail({ w, all, wishlist, tried, tastings, onWish, onToggleTried, inCompare, compareFull, onToggleCompare, inBar, onAddToBar, onSaveTasting, onOpen, onBack, onDistillery }: Props) {
  const [mode, setMode] = useState<SimilarMode>('similar');
  const [axis, setAxis] = useState<AxisKey>('smoky');
  const [delta, setDelta] = useState(2);
  const [compare, setCompare] = useState<string | null>(null);
  const [hideTried, setHideTried] = useState(false);
  const [writing, setWriting] = useState(false);

  const results = useMemo(
    () => findSimilar(w, all, { mode, shift: { axis, delta }, limit: 6, exclude: hideTried ? tried : undefined }),
    [w, all, mode, axis, delta, hideTried, tried],
  );
  const cmp = compare ? all.find((x) => x.id === compare) : undefined;
  const name = w.nameKo ?? w.name;
  const isTried = tried.has(w.id);
  const mine = tastings.filter((t) => t.whiskyId === w.id);
  const offers = offerLines(w);
  const latest = [...mine].sort((x, y) => y.date.localeCompare(x.date) || y.id.localeCompare(x.id))[0];

  return (
    <article className="detail">
      <div>
        <button className="link" onClick={onBack}>
          목록으로 돌아가기
        </button>
      </div>

      <header className="detail-head">
        <div>
          <div className={`stage${isTried ? ' tried' : ''}`}>
            <WhiskyArt w={w} height={w.image ? 280 : 230} tried={isTried} eager />
          </div>
          {w.image ? (
            <p className="photo-credit">
              사진: {w.image.url ? <a href={w.image.url} target="_blank" rel="noopener noreferrer">{w.image.credit}</a> : w.image.credit}, {w.image.license}
            </p>
          ) : (
            <p className="liquid-caption">{isTried ? `${liquidName(w)}색, 캐스크·숙성으로 추정` : '아직 빈 잔. 사진은 공개 라이선스 사진이 생기면 바뀝니다'}</p>
          )}
        </div>
        <div>
          <h1>{name}</h1>
          {w.nameKo && <p className="en">{w.name}</p>}
          {w.tags && <p className="tag-line" style={{ marginTop: 10, fontSize: 'var(--step-0)' }}>{w.tags.join(', ')}</p>}
          {w.summary && <p className="summary">{w.summary}</p>}
          <dl className="facts">
            <dt>생산지</dt>
            <dd>{[w.country, w.region].filter(Boolean).join(' ') || '정보 없음'}</dd>
            <dt>종류</dt>
            <dd>
              {TYPE_LABEL[w.type]}
              {w.distillery &&
                (onDistillery ? (
                  <>
                    {', '}
                    <AppLink href={`?tab=dist&d=${slugify(w.distillery)}`} onNavigate={() => onDistillery(slugify(w.distillery!))} className="-my-3 inline-block py-3">
                      {w.distillery.replace(/^The\s+/, '')} 증류소
                    </AppLink>
                  </>
                ) : (
                  `, ${w.distillery} 증류소`
                ))}
            </dd>
            <dt>숙성</dt>
            <dd>{w.age ? `${w.age}년` : '연수 미표기'}</dd>
            <dt>도수</dt>
            <dd className="num">{w.abv ? `${w.abv}%` : '정보 없음'}</dd>
            {w.casks && (
              <>
                <dt>캐스크</dt>
                <dd>{caskLine(w)}{w.peated ? ', 피트 몰트' : ''}</dd>
              </>
            )}
            {offers.length > 0 && (
              <>
                <dt>참고 가격</dt>
                <dd>
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {offers.map((o) => (
                      <li key={`${o.where}-${o.ml}`} className="num">
                        {o.where === 'dutyfree' ? '면세 ' : ''}
                        {sizeLabel(o.ml)} {o.text}
                      </li>
                    ))}
                  </ul>
                  <span className="text-sm text-muted">
                    추정치, 판매 정보 아님{w.trOnly ? '. 면세점 전용 제품' : ''}
                  </span>
                </dd>
              </>
            )}
            <dt>데이터</dt>
            <dd>
              {GRADE_LABEL[w.grade]} 등급, 출처 {[...new Set([w.source, ...(w.refs ?? []).map((r) => r.source)])].map((s) => SOURCE_LABEL[s]).join(', ')}
            </dd>
          </dl>
          <div className="row" style={{ marginTop: 20 }}>
            <button className="btn" onClick={() => setWriting(!writing)} aria-expanded={writing}>
              {writing ? '기록 닫기' : '시음 기록하기'}
            </button>
            <button className="btn ghost" onClick={() => onWish(w.id)} aria-pressed={wishlist.includes(w.id)}>
              {wishlist.includes(w.id) ? '위시에 담음' : '위시 담기'}
            </button>
            <button className="btn ghost" onClick={() => onToggleCompare(w.id)} aria-pressed={inCompare} disabled={!inCompare && compareFull} title={!inCompare && compareFull ? '비교함은 4종까지입니다' : undefined}>
              {inCompare ? '비교함에 담음' : '비교에 담기'}
            </button>
            <button className="btn ghost" onClick={() => onAddToBar(w.id)} aria-pressed={inBar}>
              {inBar ? '내 바에 있음' : '내 바에 추가'}
            </button>
            {mine.length === 0 && (
              <button className="btn ghost" onClick={() => onToggleTried(w.id)} aria-pressed={isTried}>
                {isTried ? '마셔봤어요 표시함' : '별점 없이 마셔봤어요'}
              </button>
            )}
          </div>
        </div>
      </header>

      {writing && (
        <div className="panel">
          <TastingForm w={w} history={mine} onSave={onSaveTasting} />
        </div>
      )}

      {latest && <TastingCard w={w} tasting={latest} />}

      {w.flavor ? (
        <section className="flavor" aria-labelledby="profile-title">
          <div>
            <h2 id="profile-title">맛 프로필</h2>
            <p className="muted small" style={{ margin: '6px 0 10px' }}>
              0~5 추정치입니다. 아래 비슷한 위스키를 골라 겹쳐 볼 수 있습니다.
            </p>
            <FlavorRadar series={[{ label: name, values: w.flavor }, ...(cmp?.flavor ? [{ label: cmp.nameKo ?? cmp.name, values: cmp.flavor }] : [])]} />
            {cmp && (
              <button className="link small" onClick={() => setCompare(null)}>
                비교 끄기
              </button>
            )}
          </div>
          <FlavorBars values={w.flavor} />
        </section>
      ) : (
        <p className="muted">이 제품은 수집 카탈로그에서 온 항목이라 아직 맛 정보가 없습니다.</p>
      )}

      {w.flavor && <PairingPanel w={w} />}

      {w.flavor && (
        <section aria-labelledby="similar-title">
          <div className="sec-head">
            <h2 id="similar-title">비슷한 위스키</h2>
            <label className="small muted">
              <input type="checkbox" checked={hideTried} onChange={(e) => setHideTried(e.target.checked)} /> 마셔본 위스키 빼기
            </label>
          </div>
          <div className="tabs" role="tablist">
            {MODES.map((m) => (
              <button key={m.id} role="tab" aria-selected={mode === m.id} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          {mode === 'shift' && (
            <div className="shift">
              <label>
                바꿀 맛
                <select id="shift-axis" value={axis} onChange={(e) => setAxis(e.target.value as AxisKey)}>
                  {AXES.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {delta > 0 ? '더 강하게' : '더 약하게'} ({delta > 0 ? '+' : ''}
                {delta})
                <input id="shift-delta" type="range" min={-3} max={3} step={1} value={delta} onChange={(e) => setDelta(Number(e.target.value) || 1)} />
              </label>
            </div>
          )}
          {results.length === 0 ? (
            <p className="muted">조건에 맞는 위스키가 아직 도감에 없습니다.{!w.price && mode !== 'similar' ? ' 이 위스키는 참고 가격이 없어 가격 비교를 할 수 없습니다.' : ''}</p>
          ) : (
            <div className="rows">
              {results.map((r) => (
                <WhiskyRow
                  key={r.whisky.id}
                  w={r.whisky}
                  tried={tried.has(r.whisky.id)}
                  score={`유사도 ${Math.round(r.score * 100)}%`}
                  why={
                    <>
                      {r.common.length > 0 && <>공통점 <b>{r.common.join(', ')}</b></>}
                      {r.diff && <>{r.common.length ? '. ' : ''}차이 {r.diff}</>}{' '}
                      {r.whisky.flavor && (
                        <button className="link small" onClick={() => setCompare(compare === r.whisky.id ? null : r.whisky.id)}>
                          {compare === r.whisky.id ? '겹쳐 보기 끄기' : '맛 그래프에 겹쳐 보기'}
                        </button>
                      )}
                    </>
                  }
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
        </section>
      )}
    </article>
  );
}

function PairingPanel({ w }: { w: Whisky }) {
  const g = pairingGuide(w);
  return (
    <section className="panel guide" aria-labelledby="pair-title">
      <div>
        <h2 id="pair-title" style={{ fontSize: 'var(--step-2)' }}>
          어울리는 안주
        </h2>
        <p className="muted small" style={{ margin: '4px 0 10px' }}>
          맛 수치로 고른 추정 가이드입니다.
        </p>
        <ul>
          {g.foods.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3>마시는 법</h3>
        <ul style={{ marginTop: 8 }}>
          {g.serve.map((s) => (
            <li key={s.label}>
              <b style={{ color: 'var(--text)' }}>{s.label}</b>, {s.why}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
