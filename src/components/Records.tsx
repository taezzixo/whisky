// 내 기록: 기록 기반 취향 레이더, 시음 일지, 위시리스트, 내보내기·가져오기

import { useMemo } from 'react';
import type { Whisky } from '../types.ts';
import { SERVE_LABEL, tasteFromTastings, type Tasting } from '../lib/collection.ts';
import type { UserData } from '../lib/store.ts';
import { Radar } from './Charts.tsx';
import { Glass } from './Glass.tsx';
import { Stars } from './Tasting.tsx';
import { WhiskyRow } from './WhiskyRow.tsx';

interface Props {
  user: UserData;
  byId: Map<string, Whisky>;
  onOpen: (id: string) => void;
  onWish: (id: string) => void;
  onRemoveTasting: (id: string) => void;
  onExport: () => void;
  onImport: (f: File) => void;
  notice: string;
}

export function Records({ user, byId, onOpen, onWish, onRemoveTasting, onExport, onImport, notice }: Props) {
  const taste = useMemo(() => tasteFromTastings(user.tastings, byId), [user.tastings, byId]);
  const log = useMemo(() => [...user.tastings].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)), [user.tastings]);
  const avg = log.length ? log.reduce((s, t) => s + t.rating, 0) / log.length : 0;

  return (
    <div className="stack">
      <section className="hero">
        <h1>내 기록</h1>
        <p className="lede">
          {log.length ? `${log.length}잔을 기록했고, 평균 별점은 ${avg.toFixed(1)}점입니다.` : '아직 기록한 잔이 없습니다. 위스키를 열어 "시음 기록하기"를 눌러 첫 잔을 남겨 보세요.'}
        </p>
      </section>

      <section className="flavor" aria-labelledby="taste-title">
        <div>
          <h2 id="taste-title">기록으로 본 내 취향</h2>
          <p className="muted small" style={{ marginTop: 6 }}>
            별점이 높은 위스키일수록 크게 반영합니다. {user.bti ? '점선은 위스키BTI 결과입니다.' : ''}
          </p>
        </div>
        {taste ? (
          <Radar series={[{ label: '시음 기록', values: taste }, ...(user.bti ? [{ label: '위스키BTI', values: user.bti.taste }] : [])]} />
        ) : (
          <p className="muted">별점을 남긴 위스키가 생기면 여기에 맛 그래프가 그려집니다.</p>
        )}
      </section>

      <section aria-labelledby="log-title">
        <div className="sec-head">
          <h2 id="log-title">시음 일지</h2>
        </div>
        {log.length === 0 ? (
          <p className="muted">기록한 잔이 여기에 날짜순으로 쌓입니다.</p>
        ) : (
          <div className="log">
            {log.map((t: Tasting) => {
              const w = byId.get(t.whiskyId);
              return (
                <div key={t.id} className="log-item">
                  {w ? <Glass w={w} size={52} /> : <span />}
                  <div>
                    <button className="link" style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600 }} onClick={() => onOpen(t.whiskyId)}>
                      {w ? w.nameKo ?? w.name : '도감에서 사라진 위스키'}
                    </button>
                    <div className="when">
                      {t.date}
                      {t.serve ? `, ${SERVE_LABEL[t.serve]}` : ''}
                    </div>
                    {t.note && <p className="note">{t.note}</p>}
                  </div>
                  <div style={{ display: 'grid', justifyItems: 'end', gap: 6 }}>
                    <Stars value={t.rating} readOnly />
                    <button className="link small" onClick={() => onRemoveTasting(t.id)}>
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="wish-title">
        <div className="sec-head">
          <h2 id="wish-title">위시리스트</h2>
          <p>{user.wishlist.length}종</p>
        </div>
        {user.wishlist.length === 0 ? (
          <p className="muted">추천 목록에서 "위시 담기"를 누르면 마셔 볼 위스키가 여기에 모입니다.</p>
        ) : (
          <div className="rows">
            {user.wishlist
              .map((id) => byId.get(id))
              .filter((w): w is Whisky => !!w)
              .map((w) => (
                <WhiskyRow key={w.id} w={w} tried={false} wished onWish={() => onWish(w.id)} onOpen={() => onOpen(w.id)} />
              ))}
          </div>
        )}
      </section>

      <section aria-labelledby="move-title">
        <h2 id="move-title">기록 옮기기</h2>
        <p className="muted small" style={{ margin: '6px 0 12px', maxWidth: '60ch' }}>
          기록은 서버로 보내지 않고 이 브라우저에만 저장됩니다. 다른 기기로 옮길 때는 파일로 내보낸 뒤 그 기기에서 가져오세요. 가져오면 기존 기록과 합쳐집니다.
        </p>
        <div className="row">
          <button className="btn" onClick={onExport}>
            파일로 내보내기
          </button>
          <label className="btn ghost">
            파일 가져오기
            <input id="import-file" type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          </label>
        </div>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
      </section>
    </div>
  );
}
