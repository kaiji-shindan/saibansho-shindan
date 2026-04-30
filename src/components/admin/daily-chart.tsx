// ============================================================
// DailyChart — 30日分の日次診断数 / LINEクリック数を SVG で描画
//
// 依存なしで自前 SVG。過度にリッチにしないことで
// Server Component のまま描画できる。
// ============================================================

import type { DailyPoint } from "@/lib/leads";

interface DailyChartProps {
  data: DailyPoint[];
}

export function DailyChart({ data }: DailyChartProps) {
  const WIDTH = 760;
  const HEIGHT = 200;
  const PAD_L = 36;
  const PAD_R = 12;
  const PAD_T = 14;
  const PAD_B = 28;

  const innerW = WIDTH - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;

  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.diagnose, d.lineClick)),
  );
  // Nice rounding of the Y axis max
  const niceMax = niceUp(maxVal);

  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const toX = (i: number) => PAD_L + i * xStep;
  const toY = (v: number) => PAD_T + innerH - (v / niceMax) * innerH;

  const linePath = (key: "diagnose" | "lineClick") =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d[key])}`)
      .join(" ");

  const areaPath = (key: "diagnose" | "lineClick") => {
    if (data.length === 0) return "";
    const firstX = toX(0);
    const lastX = toX(data.length - 1);
    const bottomY = PAD_T + innerH;
    const line = data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d[key])}`)
      .join(" ");
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  // Y axis ticks (5 levels)
  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = Math.round((niceMax / yTicks) * i);
    return { v, y: toY(v) };
  });

  // X axis: show first, middle, last labels
  const xLabelIdx = data.length <= 1 ? [0] : [0, Math.floor(data.length / 2), data.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label="日次診断数チャート"
    >
      <defs>
        <linearGradient id="diagFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06c755" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06c755" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y grid */}
      {ticks.map((t) => (
        <g key={`y${t.v}`}>
          <line
            x1={PAD_L}
            x2={WIDTH - PAD_R}
            y1={t.y}
            y2={t.y}
            stroke="#e2e8f0"
            strokeDasharray="2 3"
          />
          <text
            x={PAD_L - 6}
            y={t.y + 3}
            fontSize="9"
            fill="#94a3b8"
            textAnchor="end"
            fontFamily="monospace"
          >
            {t.v}
          </text>
        </g>
      ))}

      {/* Area fills */}
      <path d={areaPath("diagnose")} fill="url(#diagFill)" />
      <path d={areaPath("lineClick")} fill="url(#lineFill)" />

      {/* Lines */}
      <path
        d={linePath("diagnose")}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d={linePath("lineClick")}
        fill="none"
        stroke="#06c755"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots on last point */}
      {data.length > 0 && (
        <>
          <circle
            cx={toX(data.length - 1)}
            cy={toY(data[data.length - 1].diagnose)}
            r="3.5"
            fill="#8b5cf6"
            stroke="white"
            strokeWidth="1.5"
          />
          <circle
            cx={toX(data.length - 1)}
            cy={toY(data[data.length - 1].lineClick)}
            r="3.5"
            fill="#06c755"
            stroke="white"
            strokeWidth="1.5"
          />
        </>
      )}

      {/* X labels */}
      {xLabelIdx.map((i) => {
        const d = data[i];
        if (!d) return null;
        const label = d.date.slice(5); // mm-dd
        return (
          <text
            key={`x${i}`}
            x={toX(i)}
            y={HEIGHT - 8}
            fontSize="9"
            fill="#94a3b8"
            textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
            fontFamily="monospace"
          >
            {label}
          </text>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${PAD_L}, ${PAD_T - 4})`}>
        <circle cx="6" cy="0" r="4" fill="#8b5cf6" />
        <text x="14" y="3" fontSize="10" fill="#64748b" fontWeight="600">
          診断
        </text>
        <circle cx="60" cy="0" r="4" fill="#06c755" />
        <text x="68" y="3" fontSize="10" fill="#64748b" fontWeight="600">
          LINEクリック
        </text>
      </g>
    </svg>
  );
}

/** Round up to a "nice" scale (1, 2, 5, 10, 20, 50, 100, ...) */
function niceUp(v: number): number {
  if (v <= 1) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(v)));
  const residual = v / magnitude;
  let nice: number;
  if (residual <= 1) nice = 1;
  else if (residual <= 2) nice = 2;
  else if (residual <= 5) nice = 5;
  else nice = 10;
  return nice * magnitude;
}
