// 위스키 비교 (최대 4종, PRD F-106) — 작은 레이더 여러 개 + 스펙·10축 표
import type { Whisky } from '../types.ts';
import { AXES, TYPE_LABEL } from '../config/flavor.ts';
import { Radar } from './Charts.tsx';
import { WhiskyArt } from './WhiskyArt.tsx';
import { caskLine, priceText } from './WhiskyRow.tsx';

interface Props {
  items: Whisky[];
  tried: Set<string>;
  onRemove: (id: string) => void;
  onOpen: (id: string) => void;
  onBrowse: () => void;
}

export function Compare({ items, tried, onRemove, onOpen, onBrowse }: Props) {
  if (items.length === 0)
    return (
      <div className="stack">
        <section className="hero">
          <h1>위스키 비교</h1>
          <p className="lede">위스키 상세에서 "비교에 담기"를 누르면 최대 4종을 나란히 볼 수 있습니다.</p>
          <div>
            <button className="btn" onClick={onBrowse}>
              도감에서 고르기
            </button>
          </div>
        </section>
      </div>
    );
  const max = (i: number) => Math.max(...items.map((w) => w.flavor?.[i] ?? 0));
  return (
    <div className="stack">
      <section className="hero">
        <h1>위스키 비교</h1>
        <p className="lede">{items.length}종을 나란히 놓았습니다. 축마다 가장 높은 값은 금색으로 표시합니다.</p>
      </section>
      <section className="cabinet" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))` }}>
        {items.map((w) => (
          <div key={w.id} className={`slot ${tried.has(w.id) ? 'tried' : 'untried'}`} style={{ cursor: 'default' }}>
            <button className="link" style={{ textDecoration: 'none', display: 'grid', justifyItems: 'center', gap: 8, color: 'inherit' }} onClick={() => onOpen(w.id)}>
              <span className="art">
                <WhiskyArt w={w} height={130} tried={tried.has(w.id)} />
              </span>
              <span className="nm">{w.nameKo ?? w.name}</span>
            </button>
            {w.flavor && <Radar series={[{ label: w.nameKo ?? w.name, values: w.flavor }]} size={200} />}
            <button className="link small" onClick={() => onRemove(w.id)}>
              비교에서 빼기
            </button>
          </div>
        ))}
      </section>
      <section className="panel table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">항목</th>
              {items.map((w) => (
                <th key={w.id} scope="col">
                  {w.nameKo ?? w.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['생산지', (w: Whisky) => [w.country, w.region].filter(Boolean).join(' ')],
                ['종류', (w: Whisky) => TYPE_LABEL[w.type]],
                ['숙성', (w: Whisky) => (w.age ? `${w.age}년` : '미표기')],
                ['도수', (w: Whisky) => (w.abv ? `${w.abv}%` : '')],
                ['캐스크', (w: Whisky) => caskLine(w)],
                ['참고 가격', (w: Whisky) => priceText(w)],
              ] as const
            ).map(([label, fn]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {items.map((w) => (
                  <td key={w.id}>{fn(w)}</td>
                ))}
              </tr>
            ))}
            {AXES.map((a, i) => (
              <tr key={a.key}>
                <th scope="row">{a.label}</th>
                {items.map((w) => {
                  const v = w.flavor?.[i] ?? 0;
                  const top = v > 0 && v === max(i) && items.length > 1;
                  return (
                    <td key={w.id} className="num" style={top ? { color: 'var(--accent-ink)', fontWeight: 600 } : undefined}>
                      {w.flavor ? v.toFixed(1) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="muted small">맛 수치와 가격은 추정치입니다.</p>
    </div>
  );
}
