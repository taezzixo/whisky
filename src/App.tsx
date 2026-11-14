import { useEffect, useMemo, useState } from 'react';
import { BtiQuiz, BtiResult } from './components/Bti.tsx';
import { Dex } from './components/Dex.tsx';
import { FlavorMap } from './components/FlavorMap.tsx';
import { Records } from './components/Records.tsx';
import { WhiskyDetail } from './components/WhiskyDetail.tsx';
import { tasteFromTastings, triedIds } from './lib/collection.ts';
import { applyOverrides } from './lib/overrides.ts';
import { loadUserData, mergeUserData, parseUserData, removeTasting, saveUserData, toggle, upsertTasting, type UserData } from './lib/store.ts';
import type { Overrides, Whisky, WhiskiesFile } from './types.ts';

type Tab = 'dex' | 'bti' | 'map' | 'mine';
const TABS: [Tab, string][] = [
  ['dex', '도감'],
  ['bti', '위스키BTI'],
  ['map', '맛 지도'],
  ['mine', '내 기록'],
];
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
  const t = p.get('tab') as Tab;
  // 예전 주소(?tab=explore, ?tab=mine) 호환
  const tab: Tab = t === ('explore' as Tab) ? 'dex' : TABS.some(([k]) => k === t) ? t : 'dex';
  return { tab, id: p.get('w') };
}

export default function App() {
  const [file, setFile] = useState<WhiskiesFile | null>(null);
  const [overrides, setOverrides] = useState<Overrides | null>(null);
  const [catalog, setCatalog] = useState<Whisky[] | null>(null);
  const [wantCatalog, setWantCatalog] = useState(false);
  const [error, setError] = useState(false);
  const [{ tab, id }, setRoute] = useState(readUrl);
  const [user, setUser] = useState<UserData>(() => loadUserData());
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

  // 카탈로그(맛 정보 없는 수집 제품)는 필요할 때만 늦게 불러온다
  useEffect(() => {
    if ((wantCatalog || (id && !id.startsWith('seed-') && !id.startsWith('manual-'))) && catalog === null)
      getJson<{ items: Whisky[] }>('catalog.json').then((c) => setCatalog(c?.items ?? []));
  }, [wantCatalog, id, catalog]);

  useEffect(() => saveUserData(user), [user]);

  const dex = useMemo(() => applyOverrides(file?.whiskies ?? [], overrides), [file, overrides]);
  const everything = useMemo(() => [...dex, ...applyOverrides(catalog ?? [], { hide: overrides?.hide })], [dex, catalog, overrides]);
  const byId = useMemo(() => new Map(everything.map((w) => [w.id, w])), [everything]);
  const tried = useMemo(() => triedIds(user.tried, user.tastings), [user.tried, user.tastings]);
  const current = id ? byId.get(id) : undefined;
  const recordTaste = useMemo(() => tasteFromTastings(user.tastings, byId), [user.tastings, byId]);
  const me = recordTaste ? { taste: recordTaste, label: '내 기록' } : user.bti ? { taste: user.bti.taste, label: '내 BTI' } : null;

  const go = (next: { tab?: Tab; id?: string | null }) => {
    const r = { tab: next.tab ?? tab, id: next.id === undefined ? id : next.id };
    const p = new URLSearchParams();
    if (r.tab !== 'dex') p.set('tab', r.tab);
    if (r.id) p.set('w', r.id);
    try {
      history.pushState(null, '', `${location.pathname}${p.size ? `?${p}` : ''}`);
    } catch {
      /* 주소 변경이 막힌 환경에서도 화면 전환은 동작 */
    }
    setRoute(r);
    scrollTo({ top: 0 });
  };
  const open = (wid: string) => go({ id: wid });
  const wish = (wid: string) => setUser((u) => ({ ...u, wishlist: toggle(u.wishlist, wid) }));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(user, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `whisky-dex-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setNotice('내보내기 파일을 만들었습니다. 다운로드 폴더를 확인하세요.');
  };
  const importData = async (f: File) => {
    try {
      const parsed = parseUserData(JSON.parse(await f.text()));
      setUser((u) => mergeUserData(u, parsed));
      setNotice(`가져왔습니다. 시음 기록 ${parsed.tastings.length}건, 위시 ${parsed.wishlist.length}종을 기존 기록과 합쳤습니다.`);
    } catch {
      setNotice('파일을 읽지 못했습니다. 이 사이트에서 내보낸 JSON 파일인지 확인해 주세요.');
    }
  };

  return (
    <div className="app">
      <header className="top">
        <button className="wordmark" onClick={() => go({ tab: 'dex', id: null })}>
          위스키 도감
        </button>
        <nav className="nav" aria-label="메인 메뉴">
          {TABS.map(([t, label]) => (
            <button key={t} onClick={() => go({ tab: t, id: null })} aria-current={tab === t && !id ? 'page' : undefined}>
              {label}
              {t === 'mine' && user.tastings.length > 0 && <span className="count num">{user.tastings.length}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {error && <p className="notice">도감 데이터를 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.</p>}
        {file?.sample && <p className="sample-flag">샘플 데이터로 표시하고 있습니다.</p>}

        {id ? (
          current ? (
            <WhiskyDetail
              key={current.id}
              w={current}
              all={dex}
              wishlist={user.wishlist}
              tried={tried}
              tastings={user.tastings}
              onWish={wish}
              onToggleTried={(wid) => setUser((u) => ({ ...u, tried: toggle(u.tried, wid) }))}
              onSaveTasting={(t) => setUser((u) => upsertTasting(u, t))}
              onOpen={open}
              onBack={() => (history.length > 1 ? history.back() : go({ id: null }))}
            />
          ) : (
            <p className="muted">{file ? '이 위스키를 도감에서 찾지 못했습니다.' : '불러오는 중입니다.'}</p>
          )
        ) : tab === 'dex' ? (
          <Dex
            dex={dex}
            catalog={catalog}
            tried={tried}
            wishlist={user.wishlist}
            onOpen={open}
            onWish={wish}
            onNeedCatalog={() => setWantCatalog(true)}
            onStartBti={() => go({ tab: 'bti' })}
            hasBti={!!user.bti}
          />
        ) : tab === 'bti' ? (
          user.bti && !retry ? (
            <BtiResult profile={user.bti} whiskies={dex} wishlist={user.wishlist} tried={tried} onWish={wish} onOpen={open} onRetry={() => setRetry(true)} />
          ) : (
            <BtiQuiz
              onDone={(p) => {
                setUser((u) => ({ ...u, bti: { ...p, at: new Date().toISOString() } }));
                setRetry(false);
                scrollTo({ top: 0 });
              }}
            />
          )
        ) : tab === 'map' ? (
          <FlavorMap dex={dex} tried={tried} me={me} onOpen={open} />
        ) : (
          <Records
            user={user}
            byId={byId}
            onOpen={open}
            onWish={wish}
            onRemoveTasting={(tid) => setUser((u) => removeTasting(u, tid))}
            onExport={exportData}
            onImport={importData}
            notice={notice}
          />
        )}
      </main>

      <footer className="foot">
        <p>만 19세 이상을 위한 정보 서비스입니다. 주류를 판매하거나 중개하지 않습니다. 지나친 음주는 건강에 해롭습니다.</p>
        <p>
          맛 수치, 액체 색, 가격은 추정치입니다. 데이터 출처: 큐레이션 시드, Wikidata(CC0), Open Food Facts(ODbL), 아이오와 주 주류청 공개 데이터.
          {file && ` 마지막 갱신 ${file.generatedAt.slice(0, 10)}.`}
        </p>
      </footer>
    </div>
  );
}
