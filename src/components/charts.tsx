/* Lightweight theme-aware SVG charts.
   Series colors come from --chart-1..5 (validated for light & dark surfaces).
   Marks are thin with rounded data-ends, 2px surface gaps, native tooltips. */

const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function seriesColor(i: number) {
  return SERIES[i % SERIES.length];
}

/* ---------- Vertical bar chart ---------- */
export function BarChart({
  data,
  height = 180,
  format = (v: number) => String(v),
  color = 0,
}: {
  data: { label: string; value: number; tooltip?: string }[];
  height?: number;
  format?: (v: number) => string;
  color?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 100; // percentage-based layout
  const bw = W / data.length;
  const plotH = height - 38;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label="Bar chart">
        {/* baseline */}
        <line x1="0" y1={plotH + 0.5} x2={W} y2={plotH + 0.5} stroke="var(--border)" strokeWidth="0.4" />
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * (plotH - 14), d.value > 0 ? 2 : 0);
          const x = i * bw + bw * 0.22;
          const w = bw * 0.56;
          return (
            <g key={d.label} className="group">
              <title>{d.tooltip ?? `${d.label}: ${format(d.value)}`}</title>
              {/* invisible hover target across the column */}
              <rect x={i * bw} y={0} width={bw} height={plotH} fill="transparent" />
              <rect
                x={x}
                y={plotH - h}
                width={w}
                height={h}
                rx={1.4}
                fill={seriesColor(color)}
                className="transition-opacity group-hover:opacity-80"
              />
            </g>
          );
        })}
      </svg>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map((d) => (
          <div key={d.label} className="truncate px-0.5 text-center text-[10.5px] text-muted" title={d.label}>
            {d.label}
          </div>
        ))}
      </div>
      <div className="mt-1 grid" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map((d) => (
          <div key={d.label} className="truncate text-center text-[11px] font-semibold">
            {format(d.value)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Horizontal bars (funnel / category comparison) ---------- */
export function HBarList({
  data,
  format = (v: number) => String(v),
  sameHue = true,
}: {
  data: { label: string; value: number; tone?: number }[];
  format?: (v: number) => string;
  sameHue?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label} title={`${d.label}: ${format(d.value)}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-muted">{d.label}</span>
            <span className="font-semibold tabular-nums">{format(d.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, background: seriesColor(sameHue ? 0 : (d.tone ?? i)) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Donut ---------- */
export function Donut({
  data,
  format = (v: number) => String(v),
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number }[];
  format?: (v: number) => string;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 15.915; // circumference 100
  let offset = 25; // start at 12 o'clock
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 42 42" className="size-36 shrink-0" role="img" aria-label="Donut chart">
        <circle cx="21" cy="21" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="5" />
        {data.map((d, i) => {
          const frac = (d.value / total) * 100;
          const el = (
            <circle
              key={d.label}
              cx="21"
              cy="21"
              r={R}
              fill="none"
              stroke={seriesColor(i)}
              strokeWidth="5"
              strokeDasharray={`${Math.max(frac - 1.2, 0.4)} ${100 - Math.max(frac - 1.2, 0.4)}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
            >
              <title>{`${d.label}: ${format(d.value)} (${Math.round((d.value / total) * 100)}%)`}</title>
            </circle>
          );
          offset -= frac;
          return el;
        })}
        {centerValue && (
          <>
            <text x="21" y="20.5" textAnchor="middle" style={{ font: "700 6px var(--font-sans)", fill: "var(--text)" }}>
              {centerValue}
            </text>
            <text x="21" y="26.5" textAnchor="middle" style={{ font: "500 2.6px var(--font-sans)", fill: "var(--muted)" }}>
              {centerLabel}
            </text>
          </>
        )}
      </svg>
      <ul className="min-w-36 flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex items-center gap-2 text-muted">
              <span className="size-2.5 rounded-full" style={{ background: seriesColor(i) }} />
              {d.label}
            </span>
            <span className="font-semibold tabular-nums">{format(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Sparkline ---------- */
export function Sparkline({ values, height = 44, color = 0 }: { values: number[]; height?: number; color?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const W = 100;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${height - 6 - ((v - min) / range) * (height - 12)}`);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden="true">
      <polyline points={pts.join(" ")} fill="none" stroke={seriesColor(color)} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r="2.4" fill={seriesColor(color)} />
    </svg>
  );
}
