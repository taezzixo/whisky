// 테이스팅 카드 이미지 (PRD F-207): 별점·한줄평·맛 그래프를 1:1 또는 9:16 이미지로 만든다.
// 브라우저 캔버스에서만 그리고 서버로 보내지 않는다. 색은 styles.css 토큰을 읽어 쓴다.
import { useEffect, useRef, useState } from 'react';
import type { Whisky } from '../types.ts';
import { RADAR_AXES, AXES, AXIS_INDEX } from '../config/flavor.ts';
import { SERVE_LABEL, type Tasting } from '../lib/collection.ts';
import { liquidColor } from '../lib/liquid.ts';
import { Button, Chip, Section } from './ui.tsx';

type Format = 'square' | 'story';
const SIZE: Record<Format, [number, number]> = { square: [1080, 1080], story: [1080, 1920] };
const BASE = import.meta.env.BASE_URL;
const dateFmt = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

function tokens() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  return {
    bg: v('--bg'), raised: v('--raised'), line: v('--line'), text: v('--text'), text2: v('--text-2'), muted: v('--muted'),
    gold: v('--gold'), goldHi: v('--gold-hi'), goldLo: v('--gold-lo'), wineRgb: v('--wine-rgb'), series: v('--series-1'),
    display: v('--font-display'), latin: v('--font-latin'), body: v('--font-body'),
  };
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const ch of [...text]) {
    if (ctx.measureText(cur + ch).width > maxW && cur) {
      lines.push(cur);
      cur = ch.trimStart();
      if (lines.length === maxLines) break;
    } else cur += ch;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines && lines.join('').length < [...text].length) lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '…');
  return lines;
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
  }
  ctx.closePath();
}

function drawStars(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, value: number, on: string, off: string) {
  for (let i = 0; i < 5; i++) {
    const cx = x + r + i * r * 2.3;
    star(ctx, cx, y, r);
    ctx.fillStyle = off;
    ctx.fill();
    const f = Math.max(0, Math.min(1, value - i));
    if (f > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - r, y - r, 2 * r * f, 2 * r);
      ctx.clip();
      star(ctx, cx, y, r);
      ctx.fillStyle = on;
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawRadar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, f: number[], t: ReturnType<typeof tokens>) {
  const axes = RADAR_AXES.map((k) => AXIS_INDEX[k]);
  const pt = (i: number, v: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return [cx + r * (v / 5) * Math.cos(a), cy + r * (v / 5) * Math.sin(a)];
  };
  ctx.strokeStyle = t.line;
  ctx.lineWidth = 2;
  for (const lv of [1, 2, 3, 4, 5]) {
    ctx.beginPath();
    axes.forEach((_, i) => ctx.lineTo(...pt(i, lv)));
    ctx.closePath();
    ctx.stroke();
  }
  ctx.beginPath();
  axes.forEach((ax, i) => ctx.lineTo(...pt(i, f[ax])));
  ctx.closePath();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = t.series;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = t.series;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = t.text2;
  ctx.font = `500 26px ${t.body}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  axes.forEach((ax, i) => {
    const [x, y] = pt(i, 6.3);
    ctx.fillText(AXES[ax].label.split('·')[0], x, y);
  });
}

export async function drawTastingCard(canvas: HTMLCanvasElement, w: Whisky, tasting: Tasting, format: Format) {
  const [W, H] = SIZE[format];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const t = tokens();
  await Promise.all([document.fonts.load(`700 80px ${t.display}`), document.fonts.load(`500 40px ${t.latin}`), document.fonts.load(`400 34px ${t.body}`)]).catch(() => undefined);
  const img = w.image ? await loadImage(`${BASE}${w.image.src}`) : null;

  // 바탕: 보르도 블랙 + 위쪽 가넷 빛 + 금박 액자
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, t.raised);
  g.addColorStop(1, t.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, W * 0.8);
  glow.addColorStop(0, `rgba(${t.wineRgb}, 0.55)`);
  glow.addColorStop(1, `rgba(${t.wineRgb}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  const frame = ctx.createLinearGradient(0, 0, W, H);
  frame.addColorStop(0, t.goldHi);
  frame.addColorStop(0.5, t.gold);
  frame.addColorStop(1, t.goldLo);
  ctx.strokeStyle = frame;
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 1;
  ctx.strokeRect(54, 54, W - 108, H - 108);

  const story = format === 'story';
  // 병 (사진이 없으면 추정 액체 색 원)
  const bottleBox = story ? { x: W / 2 - 170, y: 140, w: 340, h: 700 } : { x: 100, y: 130, w: 330, h: 640 };
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 24;
  if (img) {
    const s = Math.min(bottleBox.w / img.width, bottleBox.h / img.height);
    const iw = img.width * s;
    const ih = img.height * s;
    ctx.drawImage(img, bottleBox.x + (bottleBox.w - iw) / 2, bottleBox.y + bottleBox.h - ih, iw, ih);
  } else {
    ctx.beginPath();
    ctx.arc(bottleBox.x + bottleBox.w / 2, bottleBox.y + bottleBox.h / 2, bottleBox.w * 0.42, 0, Math.PI * 2);
    ctx.fillStyle = liquidColor(w);
    ctx.fill();
  }
  ctx.restore();

  // 글
  const tx = story ? 110 : 480;
  const tw = story ? W - 220 : W - tx - 100;
  let y = story ? 930 : 170;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = t.text;
  ctx.font = `700 ${story ? 84 : 66}px ${t.display}`;
  for (const line of wrap(ctx, w.nameKo ?? w.name, tw, 2)) {
    y += story ? 96 : 76;
    ctx.fillText(line, tx, y);
  }
  ctx.fillStyle = t.muted;
  ctx.font = `500 ${story ? 40 : 34}px ${t.latin}`;
  y += story ? 60 : 50;
  ctx.fillText(wrap(ctx, w.name, tw, 1)[0] ?? '', tx, y);

  y += story ? 90 : 76;
  drawStars(ctx, tx, y - 18, story ? 30 : 26, tasting.rating, t.gold, t.line);
  ctx.fillStyle = t.goldHi;
  ctx.font = `600 ${story ? 56 : 48}px ${t.latin}`;
  ctx.fillText(tasting.rating.toFixed(1), tx + (story ? 30 : 26) * 2.3 * 5 + 20, y);

  y += story ? 70 : 58;
  ctx.fillStyle = t.text2;
  ctx.font = `400 ${story ? 34 : 30}px ${t.body}`;
  const meta = [dateFmt.format(new Date(`${tasting.date}T00:00:00`)), tasting.serve ? SERVE_LABEL[tasting.serve] : ''].filter(Boolean).join(', ');
  ctx.fillText(meta, tx, y);

  if (tasting.note) {
    y += story ? 90 : 72;
    ctx.fillStyle = t.text;
    ctx.font = `600 ${story ? 44 : 36}px ${t.display}`;
    for (const line of wrap(ctx, `“${tasting.note}”`, tw, story ? 4 : 3)) {
      ctx.fillText(line, tx, y);
      y += story ? 62 : 50;
    }
  }

  if (w.flavor) {
    const r = story ? 230 : 150;
    const cx = story ? W / 2 : W - 100 - r - 60;
    const cy = story ? H - 120 - r - 120 : H - 110 - r - 70;
    drawRadar(ctx, cx, cy, r, w.flavor, t);
  }

  // 바닥글
  ctx.textAlign = 'left';
  ctx.fillStyle = t.gold;
  ctx.font = `700 34px ${t.display}`;
  ctx.fillText('위스키 도감', 96, H - 92);
  ctx.textAlign = 'right';
  ctx.fillStyle = t.muted;
  ctx.font = `400 24px ${t.body}`;
  ctx.fillText('맛 그래프는 추정치, 참고용', W - 96, H - 94);
}

export function TastingCard({ w, tasting }: { w: Whisky; tasting: Tasting }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<Format>('square');
  const [msg, setMsg] = useState('');
  const canShare = typeof navigator !== 'undefined' && 'canShare' in navigator;

  useEffect(() => {
    if (ref.current) drawTastingCard(ref.current, w, tasting, format).catch(() => setMsg('카드를 그리지 못했습니다. 새로고침 뒤 다시 시도해 주세요.'));
  }, [w, tasting, format]);

  const toBlob = () => new Promise<Blob | null>((res) => ref.current?.toBlob(res, 'image/png') ?? res(null));
  const fileName = `tasting-${w.id.replace(/^seed-/, '')}-${tasting.date}.png`;

  const save = async () => {
    const b = await toBlob();
    if (!b) return setMsg('이미지를 만들지 못했습니다.');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('이미지를 저장했습니다. 다운로드 폴더를 확인하세요.');
  };
  const share = async () => {
    const b = await toBlob();
    if (!b) return setMsg('이미지를 만들지 못했습니다.');
    const file = new File([b], fileName, { type: 'image/png' });
    if (!navigator.canShare?.({ files: [file] })) return save();
    try {
      await navigator.share({ files: [file], title: `${w.nameKo ?? w.name} 테이스팅 카드` });
      setMsg('공유 창을 열었습니다.');
    } catch {
      setMsg('공유를 취소했습니다.');
    }
  };

  return (
    <Section label="테이스팅 카드" glass>
      <Section.Head title="테이스팅 카드">가장 최근 기록으로 만듭니다. 이미지는 이 기기에서만 그려집니다.</Section.Head>
      <Section.Body className="flex flex-col gap-4 md:flex-row md:items-start">
        <canvas ref={ref} className={`card-canvas ${format}`} role="img" aria-label={`${w.nameKo ?? w.name} 테이스팅 카드 미리보기, 별점 ${tasting.rating}점`} />
        <div className="flex flex-col gap-3">
          <div className="chips" role="group" aria-label="카드 비율">
            <Chip pressed={format === 'square'} onClick={() => setFormat('square')}>
              정사각 1:1
            </Chip>
            <Chip pressed={format === 'story'} onClick={() => setFormat('story')}>
              스토리 9:16
            </Chip>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save}>이미지 저장</Button>
            {canShare && (
              <Button variant="ghost" onClick={share}>
                공유하기
              </Button>
            )}
          </div>
          <p className="m-0 min-h-tap text-sm text-muted" role="status">
            {msg}
          </p>
        </div>
      </Section.Body>
    </Section>
  );
}
