// 카메라로 바코드 찾기 (PRD F-109). 브라우저 내장 BarcodeDetector가 있을 때만 버튼이 보인다(안드로이드 크롬 등).
// 영상은 기기 안에서만 처리하고 어디로도 보내지 않는다. 없으면 검색창에 바코드 숫자를 직접 입력하면 된다.

import { useEffect, useRef, useState } from 'react';

interface Detector {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type DetectorCtor = new (opts: { formats: string[] }) => Detector;

export function BarcodeScan({ onCode }: { onCode: (code: string) => void }) {
  const Ctor = (globalThis as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open || !Ctor) return;
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    const detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();
        setMsg('병의 바코드를 화면 가운데에 비춰 주세요.');
        const tick = async () => {
          if (stopped || !video.current) return;
          try {
            const found = await detector.detect(video.current);
            if (found[0]?.rawValue) {
              onCode(found[0].rawValue);
              setOpen(false);
              return;
            }
          } catch {
            /* 다음 프레임에서 다시 */
          }
          timer = window.setTimeout(tick, 300);
        };
        tick();
      } catch {
        setMsg('카메라를 쓸 수 없습니다. 브라우저의 카메라 권한을 확인하거나 바코드 숫자를 직접 입력하세요.');
      }
    })();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, Ctor, onCode]);

  if (!Ctor || !navigator.mediaDevices) return null;
  return (
    <>
      <button className="btn ghost" type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? '스캔 닫기' : '바코드 스캔'}
      </button>
      {open && (
        <div className="panel" style={{ flexBasis: '100%', display: 'grid', gap: 10 }}>
          <video ref={video} playsInline muted style={{ width: '100%', maxWidth: 420, borderRadius: 8 }} />
          <p className="small muted" role="status">
            {msg || '카메라를 켜는 중입니다.'}
          </p>
        </div>
      )}
    </>
  );
}
