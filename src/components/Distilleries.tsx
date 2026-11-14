// 증류소 페이지 (PRD F-108): 증류소 색인 → 한 증류소의 위치·라인업·대표 맛 경향.
// 테일윈드 + 테마 토큰. 계산은 lib/insights.ts.
import { useMemo, useState } from 'react';
import type { DistilleryGroup } from '../lib/insights.ts';
import { FlavorBars } from './Charts.tsx';
import { WhiskyArt, tiltHandlers } from './WhiskyArt.tsx';
import { WhiskyRow } from './WhiskyRow.tsx';
import { AppLink, Button, Chip, Section } from './ui.tsx';

interface Props {
  groups: DistilleryGroup[];
  tried: Set<string>;
  wishlist: string[];
  slug: string | null;
  onPick: (slug: string | null) => void;
  onOpen: (id: string) => void;
  onWish: (id: string) => void;
}

export function Distilleries({ groups, tried, wishlist, slug, onPick, onOpen, onWish }: Props) {
  const current = slug ? groups.find((g) => g.slug === slug) : undefined;
  if (current) return <DistilleryPage g={current} tried={tried} wishlist={wishlist} onBack={() => onPick(null)} onOpen={onOpen} onWish={onWish} />;
  return <DistilleryIndex groups={groups} onPick={onPick} />;
}

function DistilleryIndex({ groups, onPick }: { groups: DistilleryGroup[]; onPick: (slug: string) => void }) {
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const countries = useMemo(() => [...new Set(groups.map((g) => g.country))].sort((a, b) => groups.filter((g) => g.country === b).length - groups.filter((g) => g.country === a).length), [groups]);
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return groups.filter((g) => (!country || g.country === country) && (!k || g.name.toLowerCase().includes(k) || (g.region ?? '').includes(k) || g.whiskies.some((w) => (w.nameKo ?? '').includes(k))));
  }, [groups, q, country]);
  const byCountry = useMemo(() => {
    const m = new Map<string, DistilleryGroup[]>();
    for (const g of list) m.set(g.country, [...(m.get(g.country) ?? []), g]);
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [list]);
  const triedTotal = groups.filter((g) => g.tried > 0).length;

  return (
    <div className="stack">
      <section className="hero" aria-labelledby="dist-title">
        <h1 id="dist-title">증류소마다 고유한 맛이 있습니다</h1>
        <p className="lede">
          도감에 있는 증류소 {groups.length}곳 가운데 {triedTotal}곳의 위스키를 마셔 봤습니다.
        </p>
      </section>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-text-2 md:max-w-measure" htmlFor="dist-q">
          증류소 찾기
          <input id="dist-q" name="distillery" type="search" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름이나 지역 (예: 아일라, 맥캘란)…" />
        </label>
        <div className="chips" role="group" aria-label="나라">
          <Chip pressed={!country} onClick={() => setCountry('')}>
            모든 나라
          </Chip>
          {countries.map((c) => (
            <Chip key={c} pressed={country === c} onClick={() => setCountry(country === c ? '' : c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      {byCountry.length === 0 && <p className="text-muted">조건에 맞는 증류소가 없습니다. 검색어를 줄여 보세요.</p>}
      {byCountry.map(([c, gs]) => (
        <Section key={c} label={`${c} 증류소`}>
          <Section.Head title={`${c} ${gs.length}곳`} />
          <Section.Body>
            <ul className="m-0 grid list-none gap-0 p-0 md:grid-cols-2 md:gap-x-8">
              {gs.map((g) => (
                <li key={g.slug} className="min-w-0 border-0 border-b border-solid border-line">
                  <AppLink href={`?tab=dist&d=${g.slug}`} onNavigate={() => onPick(g.slug)} className="press flex min-h-tap w-full min-w-0 items-baseline justify-between gap-3 py-3 text-text no-underline transition-colors duration-ui ease-out hover:text-gold-text">
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-display text-lg font-semibold">{g.name}</span>
                      <span className="text-sm text-text-2">{[g.region, g.top.length ? `${g.top.join(', ')} 쪽` : ''].filter(Boolean).join(', ')}</span>
                    </span>
                    <span className="num shrink-0 text-sm text-text-2">
                      {g.tried > 0 ? <span className="text-gold-text">{g.tried}</span> : 0}/{g.whiskies.length}종
                    </span>
                  </AppLink>
                </li>
              ))}
            </ul>
          </Section.Body>
        </Section>
      ))}
    </div>
  );
}

function DistilleryPage({ g, tried, wishlist, onBack, onOpen, onWish }: { g: DistilleryGroup; tried: Set<string>; wishlist: string[]; onBack: () => void; onOpen: (id: string) => void; onWish: (id: string) => void }) {
  const osm = g.lat != null && g.lng != null ? `https://www.openstreetmap.org/?mlat=${g.lat}&mlon=${g.lng}#map=11/${g.lat}/${g.lng}` : null;
  return (
    <div className="stack">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          증류소 목록
        </Button>
      </div>
      <header className="flex flex-col gap-2">
        <h1 className="m-0">{g.name} 증류소</h1>
        <p className="m-0 text-text-2">
          {[g.country, g.region].filter(Boolean).join(' ')}
          {osm && (
            <>
              {', '}
              <a href={osm} target="_blank" rel="noopener noreferrer">
                지도에서 위치 보기
              </a>
            </>
          )}
        </p>
        <p className="m-0 text-sm text-muted">
          도감 라인업 {g.whiskies.length}종, 마신 위스키 {g.tried}종
        </p>
      </header>

      {/* 진열 선반: 라인업을 한 줄로. 좁은 화면에서는 가로로 넘겨 본다 */}
      <div className="cabinet-row" role="group" aria-label={`${g.name} 라인업 진열장`}>
        {g.whiskies.map((w) => {
          const on = tried.has(w.id);
          return (
            <button key={w.id} type="button" className={`slot ${on ? 'tried' : 'untried'}`} onClick={() => onOpen(w.id)} {...tiltHandlers()} aria-label={`${w.nameKo ?? w.name}${on ? ', 마신 위스키' : ''}`}>
              <span className="art">
                <WhiskyArt w={w} height={130} tried={on} />
              </span>
              <span className="nm">{w.nameKo ?? w.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Section label="대표 맛 경향" glass>
          <Section.Head title="대표 맛 경향">라인업 평균. 시드 맛 수치로 계산한 추정치이며 참고용입니다.</Section.Head>
          <Section.Body>{g.flavor ? <FlavorBars values={g.flavor} /> : <p className="text-muted">맛 정보가 아직 없습니다.</p>}</Section.Body>
        </Section>
        <Section label="라인업">
          <Section.Head title="라인업" />
          <Section.Body className="rows">
            {g.whiskies.map((w) => (
              <WhiskyRow key={w.id} w={w} tried={tried.has(w.id)} wished={wishlist.includes(w.id)} onWish={() => onWish(w.id)} onOpen={() => onOpen(w.id)} />
            ))}
          </Section.Body>
        </Section>
      </div>
    </div>
  );
}
