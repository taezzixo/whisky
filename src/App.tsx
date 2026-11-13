import { useEffect, useMemo, useState } from 'react';
import { BtiQuiz, BtiResult } from './components/Bti.tsx';
import { WhiskyCard } from './components/WhiskyCard.tsx';
import { WhiskyDetail } from './components/WhiskyDetail.tsx';
import { applyOverrides, searchWhiskies } from './lib/overrides.ts';
import { loadUserData, mergeUserData, parseUserData, saveUserData, toggle, type UserData } from './lib/store.ts';
import type { Overrides, Whisky, WhiskiesFile } from './types.ts';

type Tab = 'bti' | 'explore' | 'mine';
const BASE = import.meta.env.BASE_URL;

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${BASE}data/${path}`);
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

function readUrl(): { tab: Tab; id: string | null } {
  const p = new URLSearchParams(location.search);
  const id = p.get('w');
  const tab = (p.get('tab') as Tab) || (id ? 'explore' : 'bti');
  return { tab: ['bti', 'explore', 'mine'].includes(tab) ? tab : 'bti', id };
}

export default function App() {
  const [file, setFile] = useState<WhiskiesFile | null>(null);
  const [overrides, setOverrides] = useState<Overrides | null>(null);
  const [catalog, setCatalog] = useState<Whisky[] | null>(null);
  const [error, setError] = useState(false);
  const [{ tab, id }, setRoute] = useState(readUrl);
  const [user, setUser] = useState<UserData>(() => loadUserData());
  const [query, setQuery] = useState('');
  const [retry, setRetry] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.all([getJson<WhiskiesFile>('whiskies.json'), getJson<Overrides>('overrides.json')]).then(([f, o]) => {
      if (!f) setError(true);
      setFile(f);
      setOverrides(o);
    });
    const onPop = () => setRoute(readUrl());
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  // 검색 탭에 들어가거나 카탈로그 항목 링크로 들어오면 카탈로그(맛 정보 없는 수집 항목)를 늦게 불러온다
  useEffect(() => {
    if ((tab === 'explore' || (id && !id.startsWith('seed-'))) && catalog === null)
      getJson<{ items: Whisky[] }>('catalog.json').then((c) => setCatalog(c?.items ?? []));
  }, [tab, id, catalog]);

  useEffect(() => saveUserData(user), [user]);

  const dex = useMemo(() => applyOverrides(file?.whiskies ?? [], overrides), [file, overrides]);
  const everything = useMemo(() => [...dex, ...applyOverrides(catalog ?? [], { hide: overrides?.hide })], [dex, catalog, overrides]);
  const current = id ? everything.find((w) => w.id === id) : undefined;

  const go = (next: { tab?: Tab; id?: string | null }) => {
    const r = { tab: next.tab ?? tab, id: next.id === undefined ? id : next.id };
    const p = new URLSearchParams();
    if (r.tab !== 'bti') p.set('tab', r.tab);
    if (r.id) p.set('w', r.id);
    try {
      history.pushState(null, '', `${location.pathname}${p.size ? `?${p}` : ''}`);
    } catch {
      /* 샌드박스 프레임 등 주소 변경이 막힌 곳에서도 화면 전환은 동작 */
    }
    setRoute(r);
    scrollTo({ top: 0 });
  };
  const open = (wid: string) => go({ tab: 'explore', id: wid });
  const wish = (wid: string) => setUser((u) => ({ ...u, wishlist: toggle(u.wishlist, wid) }));
  const tried = (wid: string) => setUser((u) => ({ ...u, tried: toggle(u.tried, wid) }));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(user, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `whisky-dex-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = async (f: File) => {
    try {
      const parsed = parseUserData(JSON.parse(await f.text()));
      setUser((u) => mergeUserData(u, parsed));
      setNotice('가져오기 완료: 기존 기록과 합쳤어요.');
    } catch {
      setNotice('파일을 읽지 못했어요. 이 사이트에서 내보낸 JSON 파일인지 확인해 주세요.');
    }
  };

  const results = useMemo(() => searchWhiskies(everything, query, 60), [everything, query]);
  const byId = (wid: string) => everything.find((w) => w.id === wid);

  return (
    <div className="app">
      <header className="top">
        <button className="logo" onClick={() => go({ tab: 'bti', id: null })}>
          <span aria-hidden="true">🥃</span> 위스키 도감
        </button>
        <nav className="nav" aria-label="메인 메뉴">
          {(
            [
              ['bti', '위스키BTI'],
              ['explore', '찾아보기'],
              ['mine', `내 목록${user.wishlist.length ? ` ${user.wishlist.length}` : ''}`],
            ] as const
          ).map(([t, label]) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => go({ tab: t, id: null })} aria-current={tab === t ? 'page' : undefined}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {error && <div className="card warn">데이터를 불러오지 못했어요. 잠시 후 새로고침해 주세요.</div>}
        {file?.sample && <p className="sample-flag">샘플 데이터로 표시 중 (수집 전)</p>}

        {tab === 'bti' &&
          (user.bti && !retry ? (
            <BtiResult
              profile={user.bti}
              whiskies={dex}
              wishlist={user.wishlist}
              onWish={wish}
              onOpen={open}
              onRetry={() => setRetry(true)}
            />
          ) : (
            <>
              <div className="hero">
                <h1>나에게 맞는 위스키는?</h1>
                <p>커피·디저트 취향 같은 8개 질문으로 위스키 취향 유형과 추천 위스키 3개를 알려드려요. 1분이면 끝나요.</p>
              </div>
              <BtiQuiz
                onDone={(p) => {
                  setUser((u) => ({ ...u, bti: { ...p, at: new Date().toISOString() } }));
                  setRetry(false);
                }}
              />
            </>
          ))}

        {tab === 'explore' &&
          (id ? (
            current ? (
              <WhiskyDetail
                key={current.id}
                w={current}
                all={dex}
                wishlist={user.wishlist}
                tried={user.tried}
                onWish={wish}
                onTried={tried}
                onOpen={open}
                onBack={() => go({ id: null })}
              />
            ) : (
              <p className="muted">{file ? '위스키를 찾을 수 없어요.' : '불러오는 중…'}</p>
            )
          ) : (
            <section>
              <div className="search">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="이름·증류소·향으로 검색 (예: 맥캘란, 아일라, 바닐라)"
                  aria-label="위스키 검색"
                  autoFocus
                />
                <p className="muted small">
                  도감 {dex.length}종{catalog?.length ? ` · 수집 카탈로그 ${catalog.length.toLocaleString()}건` : ''} · 위스키를 고르면 비슷한 위스키를 추천해요
                </p>
              </div>
              <div className="grid">
                {results.map((w) => (
                  <WhiskyCard key={w.id} w={w} wished={user.wishlist.includes(w.id)} onWish={() => wish(w.id)} onOpen={() => open(w.id)} />
                ))}
              </div>
              {results.length === 0 && <p className="muted">검색 결과가 없어요.</p>}
            </section>
          ))}

        {tab === 'mine' && (
          <section>
            <h2>위시리스트</h2>
            {user.wishlist.length === 0 ? (
              <p className="muted">BTI 결과나 추천 카드에서 ♡를 눌러 담아 보세요.</p>
            ) : (
              <div className="grid">
                {user.wishlist.map(byId).filter((w): w is Whisky => !!w).map((w) => (
                  <WhiskyCard key={w.id} w={w} wished onWish={() => wish(w.id)} onOpen={() => open(w.id)} />
                ))}
              </div>
            )}
            <h2>마셔본 위스키 {user.tried.length ? `(${user.tried.length})` : ''}</h2>
            {user.tried.length === 0 ? (
              <p className="muted">위스키 상세에서 "마셔봤어요"를 눌러 기록해요.</p>
            ) : (
              <div className="grid">
                {user.tried.map(byId).filter((w): w is Whisky => !!w).map((w) => (
                  <WhiskyCard key={w.id} w={w} wished={user.wishlist.includes(w.id)} onWish={() => wish(w.id)} onOpen={() => open(w.id)} />
                ))}
              </div>
            )}
            <div className="card">
              <h3>내 기록 옮기기</h3>
              <p className="muted small">기록은 서버로 보내지 않고 이 브라우저에만 저장돼요. 다른 기기로 옮길 때는 파일로 내보내고 가져오세요.</p>
              <div className="row">
                <button className="btn" onClick={exportData}>
                  JSON 내보내기
                </button>
                <label className="btn ghost">
                  가져오기
                  <input id="import-file" type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
                </label>
              </div>
              {notice && (
                <p className="notice" role="status">
                  {notice}
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="foot">
        <p>만 19세 이상을 위한 정보 서비스입니다. 주류를 판매하거나 중개하지 않습니다. 지나친 음주는 건강에 해롭습니다.</p>
        <p>
          맛 수치·가격은 추정치(참고용)입니다. 데이터: 큐레이션 시드, Wikidata(CC0), Open Food Facts(ODbL), Iowa Alcoholic Beverages Division 공개 데이터.
          {file && ` 갱신 ${file.generatedAt.slice(0, 10)}`}
        </p>
      </footer>
    </div>
  );
}
