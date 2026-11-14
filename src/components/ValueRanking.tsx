// 체감 가성비 랭킹 (PRD F-603): 내 평균 별점 ÷ 참고 가격(10만 원 단위). 표로 보여 준다.
import { useMemo } from 'react';
import type { Whisky } from '../types.ts';
import type { Tasting } from '../lib/collection.ts';
import { valueRanking } from '../lib/insights.ts';
import { WhiskyArt } from './WhiskyArt.tsx';
import { AppLink, Section } from './ui.tsx';

const fmt = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 });
const fmtIndex = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 });

export function ValueRanking({ tastings, byId, onOpen }: { tastings: Tasting[]; byId: Map<string, Whisky>; onOpen: (id: string) => void }) {
  const rows = useMemo(() => valueRanking(tastings, byId), [tastings, byId]);
  return (
    <Section label="체감 가성비" glass>
      <Section.Head title="체감 가성비">내 별점을 참고 가격으로 나눈 값입니다(10만 원당 별점). 가격은 추정치이고 판매 정보가 아닙니다.</Section.Head>
      <Section.Body>
        {rows.length === 0 ? (
          <p className="m-0 text-muted">참고 가격이 있는 위스키에 별점을 남기면 여기서 순위를 매겨 드립니다.</p>
        ) : (
          <div className="table-wrap">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">내 별점 기준 가성비 순위</caption>
              <thead>
                <tr className="whitespace-nowrap text-left text-muted">
                  <th scope="col" className="py-2 pr-3 font-normal">순위</th>
                  <th scope="col" className="py-2 pr-3 font-normal">위스키</th>
                  <th scope="col" className="py-2 pr-3 text-right font-normal">내 별점</th>
                  <th scope="col" className="hidden py-2 pr-3 text-right font-normal md:table-cell">참고 가격</th>
                  <th scope="col" className="py-2 text-right font-normal">
                    10만 원당
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.w.id} className="border-0 border-t border-solid border-line">
                    <td className="num py-2 pr-3 text-muted">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <AppLink href={`?w=${r.w.id}`} onNavigate={() => onOpen(r.w.id)} className="press flex min-h-tap min-w-0 items-center gap-3 text-text no-underline hover:text-accent">
                        <span className="flex w-10 shrink-0 justify-center" aria-hidden="true">
                          <WhiskyArt w={r.w} height={44} />
                        </span>
                        <span className="min-w-0 font-display font-semibold">{r.w.nameKo ?? r.w.name}</span>
                      </AppLink>
                    </td>
                    <td className="num whitespace-nowrap py-2 pr-3 text-right">
                      {fmt.format(r.rating)}
                      {r.count > 1 && <span className="text-muted"> ({r.count}잔)</span>}
                    </td>
                    <td className="num hidden whitespace-nowrap py-2 pr-3 text-right text-text-2 md:table-cell">약 {fmt.format(r.w.price!)}만 원</td>
                    <td className={`num whitespace-nowrap py-2 text-right font-semibold ${i === 0 ? 'text-accent-ink' : 'text-text'}`}>{fmtIndex.format(r.index)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section.Body>
    </Section>
  );
}
