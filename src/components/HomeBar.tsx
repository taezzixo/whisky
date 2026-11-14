// 나만의 가상 바 (PRD F-301~303) — 보유 바틀 상태·남은 양·개봉일, 산화 안내
import type { Whisky } from '../types.ts';
import { BOTTLE_STATE_LABEL, oxidationAdvice, type BottleState, type CabinetItem } from '../lib/collection.ts';
import { WhiskyArt } from './WhiskyArt.tsx';

const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

interface Props {
  items: CabinetItem[];
  byId: Map<string, Whisky>;
  onChange: (c: CabinetItem) => void;
  onRemove: (id: string) => void;
  onOpen: (id: string) => void;
}

export function HomeBar({ items, byId, onChange, onRemove, onOpen }: Props) {
  const t = today();
  const sorted = [...items].sort((a, b) => {
    const rank = (c: CabinetItem) => ({ now: 0, soon: 1, ok: 2 })[oxidationAdvice(c, t)?.level ?? 'ok'] * 10 + ({ open: 0, sealed: 1, empty: 2 } as const)[c.state];
    return rank(a) - rank(b);
  });
  return (
    <section aria-labelledby="bar-title">
      <div className="sec-head">
        <h2 id="bar-title">내 바</h2>
        <p>
          {items.filter((c) => c.state !== 'empty').length}병 보유, 마시는 중 {items.filter((c) => c.state === 'open').length}병
        </p>
      </div>
      {items.length === 0 ? (
        <p className="muted">위스키 상세에서 "내 바에 추가"를 누르면 집에 있는 병을 관리할 수 있습니다. 연 날짜와 남은 양을 적어 두면 빨리 마셔야 할 병을 알려 드립니다.</p>
      ) : (
        <div className="bar-shelf">
          {sorted.map((c) => {
            const w = byId.get(c.whiskyId);
            const adv = oxidationAdvice(c, t);
            return (
              <div key={c.id} className={`panel bottle-card${c.state === 'empty' ? ' untried' : ''}`}>
                <button className="link" style={{ display: 'grid', placeItems: 'end center', height: 92 }} onClick={() => onOpen(c.whiskyId)} aria-label={`${w?.nameKo ?? w?.name ?? ''} 상세`}>
                  {w && <WhiskyArt w={w} height={88} />}
                </button>
                <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
                  <b style={{ fontFamily: 'var(--font-display)' }}>{w ? w.nameKo ?? w.name : '도감에서 사라진 위스키'}</b>
                  <label className="state">
                    상태{' '}
                    <select
                      value={c.state}
                      onChange={(e) => {
                        const state = e.target.value as BottleState;
                        onChange({ ...c, state, fill: state === 'empty' ? 0 : state === 'sealed' ? 100 : c.fill, openedAt: state === 'open' ? c.openedAt ?? t : c.openedAt });
                      }}
                      aria-label="병 상태"
                    >
                      {Object.entries(BOTTLE_STATE_LABEL).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  {c.state === 'open' && (
                    <>
                      <label className="state">
                        남은 양 {c.fill}%
                        <input type="range" min={0} max={100} step={5} value={c.fill} onChange={(e) => onChange({ ...c, fill: Number(e.target.value) })} aria-label="남은 양" style={{ width: '100%' }} />
                      </label>
                      <div className="fill" aria-hidden="true">
                        <i style={{ width: `${c.fill}%` }} />
                      </div>
                      <label className="state">
                        연 날짜{' '}
                        <input type="date" value={c.openedAt ?? ''} max={t} onChange={(e) => onChange({ ...c, openedAt: e.target.value || undefined })} style={{ minHeight: 36, padding: '4px 8px' }} />
                      </label>
                      {adv && <p className={adv.level === 'ok' ? 'state' : 'warn-text'}>{adv.text}</p>}
                    </>
                  )}
                  <button className="link small" style={{ justifySelf: 'start' }} onClick={() => onRemove(c.id)}>
                    내 바에서 빼기
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
