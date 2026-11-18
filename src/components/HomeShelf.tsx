// 첫 화면 시안 (?hero=shelf): 내 바 선반 + 최근 마신 잔 리본 + 다음 잔 추천.
// 선반: 최근에 마신 병이 왼쪽부터 놓이고, 남은 자리는 점선 칸("다음 자리").
// 리본: 최근 시음 순서대로 색 점·날짜·별점. 끝에 다음 잔 추천 한 병.
import type { Whisky } from '../types.ts';
import type { ShelfItem } from '../lib/insights.ts';
import { liquidColor } from '../lib/liquid.ts';
import { WhiskyArt, tiltHandlers } from './WhiskyArt.tsx';
import { AppLink } from './ui.tsx';

const SLOTS = 7;
const md = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' });
const day = (d: string) => md.format(new Date(`${d}T00:00:00`));

interface Props {
  shelf: ShelfItem[];
  pick: { w: Whisky; reason: string } | null;
  onOpen: (id: string) => void;
}

export function HomeShelf({ shelf, pick, onOpen }: Props) {
  const empty = Math.max(0, SLOTS - shelf.length);
  return (
    <div className="flex flex-col gap-8">
      {/* 내 바 선반 */}
      <div className="home-shelf" role="list" aria-label="내 바 선반, 최근에 마신 병">
        {shelf.slice(0, SLOTS).map((s) => (
          <div key={s.w.id} role="listitem" className="shelf-slot">
            <button type="button" className="shelf-bottle" onClick={() => onOpen(s.w.id)} {...tiltHandlers()} aria-label={`${s.w.nameKo ?? s.w.name}, ${day(s.date)}에 별점 ${s.rating}`}>
              <WhiskyArt w={s.w} height={150} />
            </button>
            <span className="shelf-name">{s.w.nameKo ?? s.w.name}</span>
          </div>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <div key={`e${i}`} role="listitem" className="shelf-slot">
            <span className="shelf-empty" aria-hidden="true">
              {i === 0 ? '다음 자리' : ''}
            </span>
            <span className="shelf-name text-muted">{i === 0 ? (shelf.length ? '한 잔 더 기록하면 여기에' : '첫 병을 기록해 보세요') : ''}</span>
          </div>
        ))}
      </div>

      {/* 최근 마신 잔 → 다음 잔 */}
      <div className="grid gap-6 md:grid-cols-3">
        <section aria-labelledby="recent-title" className="flex min-w-0 flex-col gap-3 md:col-span-2">
          <h2 id="recent-title" className="m-0 text-lg">
            최근 마신 잔
          </h2>
          {shelf.length === 0 ? (
            <p className="m-0 text-text-2">아직 기록이 없습니다. 위스키를 열어 "시음 기록하기"를 누르면 여기에 날짜순으로 쌓입니다.</p>
          ) : (
            <ol className="ribbon">
              {shelf.slice(0, 6).map((s) => (
                <li key={s.w.id}>
                  <AppLink href={`?w=${s.w.id}`} onNavigate={() => onOpen(s.w.id)} className="ribbon-item">
                    <span className="ribbon-dot" style={{ background: liquidColor(s.w) }} aria-hidden="true" />
                    <span className="ribbon-date num">{day(s.date)}</span>
                    <span className="ribbon-name">{s.w.nameKo ?? s.w.name}</span>
                    <span className="ribbon-rate num" aria-label={`별점 ${s.rating}`}>
                      ★ {s.rating.toFixed(1)}
                      {s.count > 1 && <span className="text-muted">, {s.count}잔</span>}
                    </span>
                  </AppLink>
                </li>
              ))}
            </ol>
          )}
        </section>

        {pick && (
          <section aria-labelledby="next-title" className="next-pick">
            <h2 id="next-title" className="m-0 text-lg">
              다음 잔으로 이건 어때요?
            </h2>
            <AppLink href={`?w=${pick.w.id}`} onNavigate={() => onOpen(pick.w.id)} className="next-pick-body">
              <span className="flex w-16 shrink-0 justify-center" aria-hidden="true">
                <WhiskyArt w={pick.w} height={96} />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <strong className="font-display text-lg">{pick.w.nameKo ?? pick.w.name}</strong>
                <span className="text-sm text-text-2">{pick.reason}</span>
                <span className="text-sm text-accent-ink">자세히 보기</span>
              </span>
            </AppLink>
          </section>
        )}
      </div>
    </div>
  );
}
