// 맛 프로필 레이더 (Bklit UI 레이더 차트). 10축 0~5 → 0~100. 두 번째 계열은 비교 대상.
// 색은 차트 전용 토큰(--series-1 앰버, --series-2 스틸 블루)만 쓴다.
import { AXES } from '../config/flavor.ts';
import { RadarArea } from '../vendor/bklit/charts/radar-area.tsx';
import { RadarAxis } from '../vendor/bklit/charts/radar-axis.tsx';
import { RadarChart } from '../vendor/bklit/charts/radar-chart.tsx';
import { RadarGrid } from '../vendor/bklit/charts/radar-grid.tsx';
import { RadarLabels } from '../vendor/bklit/charts/radar-labels.tsx';

const SERIES = ['var(--series-1)', 'var(--series-2)'];

export function FlavorRadar({ series, size = 320 }: { series: { label: string; values: number[] }[]; size?: number }) {
  const metrics = AXES.map((a) => ({ key: a.key, label: a.label.split('·')[0] }));
  const data = series.slice(0, 2).map((s, i) => ({
    label: s.label,
    color: SERIES[i],
    values: Object.fromEntries(AXES.map((a, k) => [a.key, (s.values[k] ?? 0) * 20])),
  }));
  return (
    <figure className="flavor-radar m-0" aria-label={`맛 레이더: ${series.map((s) => s.label).join(', ')}`}>
      <RadarChart data={data} metrics={metrics} size={size} levels={5} margin={48}>
        <RadarGrid showLabels={false} />
        <RadarAxis />
        <RadarLabels fontSize={11} />
        {data.map((d, i) => (
          <RadarArea key={d.label} index={i} showPoints showGlow={i === 0} />
        ))}
      </RadarChart>
      {data.length > 1 && (
        <figcaption className="flex flex-wrap gap-4 text-sm text-text-2">
          {data.map((d, i) => (
            <span key={d.label} className="inline-flex items-center gap-2">
              <span className={`legend-swatch s${i + 1}`} aria-hidden="true" />
              {d.label}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
