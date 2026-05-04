import { useEffect, useRef, useState } from 'react';

export interface DataPoint {
  day: number;
  value: number;
  lower?: number;
  upper?: number;
  confidence?: number;
}

function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2)
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpX = ((prev.x + curr.x) / 2).toFixed(1);
    d += ` C${cpX},${prev.y.toFixed(1)} ${cpX},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
  }
  return d;
}

interface DecayAreaChartProps {
  data: DataPoint[];
  todayIdx?: number;
  width?: number;
  height?: number;
  color?: string;
  confidenceData?: Array<{ day: number; lower: number; upper: number }>;
  showConfidence?: boolean;
  valueFormatter?: (value: number) => string;
}

export function DecayAreaChart({
  data,
  todayIdx,
  width = 560,
  height = 260,
  color = '#C5FF3D',
  confidenceData,
  showConfidence = true,
  valueFormatter = (value) => Math.floor(value).toLocaleString(),
}: DecayAreaChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number; d: DataPoint } | null>(null);

  useEffect(() => {
    setDrawn(false);
    const t = setTimeout(() => setDrawn(true), 50);
    return () => clearTimeout(t);
  }, [data]);

  if (!data || data.length < 2) return null;

  const padL = 32, padR = 16, padT = 10, padB = 30;
  const cw = width - padL - padR;
  const ch = height - padT - padB;

  const vals = data.map((d) => d.value);
  const minV = Math.min(...vals) * 0.995;
  const maxV = Math.max(...vals) * 1.002;
  const range = maxV - minV || 1;

  const toX = (i: number) => padL + (i / Math.max(data.length - 1, 1)) * cw;
  const toY = (v: number) => padT + (1 - (v - minV) / range) * ch;

  const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.value) }));
  const linePath = smoothPath(pts);
  const areaPath = `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(padT + ch).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT + ch).toFixed(1)} Z`;
  const bandSource = confidenceData ?? data.filter((d) => d.lower != null && d.upper != null).map((d) => ({ day: d.day, lower: d.lower!, upper: d.upper! }));
  const bandPath = bandSource.length > 1
    ? `${smoothPath(bandSource.map((d, i) => ({ x: toX(i), y: toY(d.upper) })))} ${smoothPath([...bandSource].reverse().map((d, i) => ({ x: toX(bandSource.length - 1 - i), y: toY(d.lower) }))).replace(/^M/, 'L')} Z`
    : '';

  const todayX = todayIdx != null ? toX(todayIdx) : null;
  const gradId = `ag${color.replace('#', '')}`;
  const clipId = `cc${color.replace('#', '')}`;

  const yTicks = [0, 0.5, 1].map((t) => ({ val: minV + t * range, y: toY(minV + t * range) }));
  const xTicks: Array<{ day: number; x: number }> = [];
  data.forEach((d, i) => {
    if (d.day % 7 === 0) xTicks.push({ day: d.day, x: toX(i) });
  });

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) * (width / rect.width) - padL;
    const idx = Math.round((mx / cw) * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    setTooltip({ idx: clamped, x: toX(clamped), y: toY(data[clamped].value), d: data[clamped] });
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible', display: 'block' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip(null)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x={padL} y={padT} width={cw} height={ch} />
        </clipPath>
      </defs>

      {/* Y axis ticks */}
      {yTicks.map((t, i) => (
        <text key={i} x={padL - 5} y={t.y + 3} textAnchor="end"
          fill="#71717A" fontSize="9" fontFamily="'JetBrains Mono', monospace">
          {valueFormatter(t.val)}
        </text>
      ))}

      {/* X axis ticks */}
      {xTicks.map((t, i) => (
        <text key={i} x={t.x} y={height - 4} textAnchor="middle"
          fill="#71717A" fontSize="9" fontFamily="'Inter', sans-serif">
          d{t.day}
        </text>
      ))}

      {/* Horizontal grid lines */}
      {yTicks.map((t, i) => (
        <line key={i} x1={padL} y1={t.y} x2={padL + cw} y2={t.y}
          stroke="#2A2A2E" strokeWidth="1" />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} clipPath={`url(#${clipId})`} />

      {/* Confidence band */}
      {showConfidence && bandPath && (
        <path
          d={bandPath}
          fill={color}
          opacity="0.08"
          clipPath={`url(#${clipId})`}
          style={{
            transition: drawn ? 'opacity 300ms ease-out 300ms' : 'none',
            opacity: drawn ? 0.08 : 0,
          }}
        />
      )}

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        clipPath={`url(#${clipId})`}
        style={{
          strokeDasharray: drawn ? 'none' : '3000',
          strokeDashoffset: drawn ? 0 : 3000,
          transition: drawn ? 'stroke-dashoffset 700ms ease-out' : 'none',
        }}
      />

      {/* Today marker */}
      {todayX != null && (
        <g>
          <line x1={todayX} y1={padT} x2={todayX} y2={padT + ch}
            stroke="#71717A" strokeWidth="1" strokeDasharray="3 3" />
          <text x={todayX + 4} y={padT + 11} fill="#71717A" fontSize="9"
            fontFamily="'Inter', sans-serif">
            Today
          </text>
        </g>
      )}

      {/* Tooltip */}
      {tooltip && (
        <g>
          <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={color} />
          <rect
            x={Math.min(tooltip.x + 8, width - 92)}
            y={tooltip.y - 30}
            width="84" height="38" rx="5"
            fill="#1C1C1F" stroke="#2A2A2E" strokeWidth="1"
          />
          <text x={Math.min(tooltip.x + 16, width - 76)} y={tooltip.y - 15}
            fill="#71717A" fontSize="9" fontFamily="'Inter', sans-serif">
            Day {tooltip.d.day}
          </text>
          <text x={Math.min(tooltip.x + 16, width - 76)} y={tooltip.y + 2}
            fill="#F4F4F5" fontSize="11" fontWeight="600"
            fontFamily="'JetBrains Mono', monospace">
            {valueFormatter(tooltip.d.value)}
            {tooltip.d.confidence ? ` ±${Math.floor(tooltip.d.confidence)}%` : ''}
          </text>
        </g>
      )}

      {/* Legend */}
      <g transform={`translate(${padL}, ${padT + ch + 14})`}>
        <line x1="0" y1="0" x2="16" y2="0" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <text x="22" y="3" fill="#71717A" fontSize="9" fontFamily="'Inter', sans-serif">Predicted</text>
        {todayX != null && (
          <>
            <line x1="80" y1="0" x2="80" y2="-8" stroke="#71717A" strokeWidth="1" strokeDasharray="2 2" />
            <text x="86" y="3" fill="#71717A" fontSize="9" fontFamily="'Inter', sans-serif">Today</text>
          </>
        )}
      </g>
    </svg>
  );
}

interface SparklineProps {
  data: DataPoint[];
  color?: string;
  width?: number;
  height?: number;
}

export function ChartSparkline({ data, color = '#C5FF3D', width = 100, height = 28 }: SparklineProps) {
  if (!data || data.length < 2) return null;
  const vals = data.map((d) => d.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - 2 - ((d.value - minV) / range) * (height - 4),
  }));
  const path = smoothPath(pts);
  const area = `${path} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`;
  const gid = `sg${color.replace('#', '')}w${width}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
