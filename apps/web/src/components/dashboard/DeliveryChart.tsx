interface TrendPoint {
  date: string;
  sent: number;
  failed: number;
}

/** Lightweight dependency-free SVG line chart for the 7-day delivery trend. */
export function DeliveryChart({ data }: { data: TrendPoint[] }) {
  const width = 560;
  const height = 200;
  const pad = { top: 16, right: 12, bottom: 28, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(4, ...data.map((d) => Math.max(d.sent, d.failed)));

  const x = (i: number) =>
    pad.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : innerW / 2);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  const path = (key: 'sent' | 'failed') =>
    data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');

  const gridLines = [0, 0.5, 1].map((f) => Math.round(max * f));

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Delivery trend for the last ${data.length} days`}
        style={{ width: '100%', height: 'auto' }}
      >
        {gridLines.map((v) => (
          <g key={v}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-border)"
              strokeDasharray="3 4"
            />
            <text x={pad.left - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="var(--color-muted)">
              {v}
            </text>
          </g>
        ))}
        <path d={path('sent')} fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" />
        <path d={path('failed')} fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={d.date}>
            <circle cx={x(i)} cy={y(d.sent)} r="3" fill="var(--color-success)" />
            <circle cx={x(i)} cy={y(d.failed)} r="2.5" fill="var(--color-danger)" />
            <text x={x(i)} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
              {d.date.slice(5)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="muted" style={{ display: 'flex', gap: 16, fontSize: 'var(--text-xs)' }}>
        <span><span aria-hidden="true" style={{ color: 'var(--color-success)' }}>●</span> Sent</span>
        <span><span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>●</span> Failed</span>
      </figcaption>
    </figure>
  );
}
