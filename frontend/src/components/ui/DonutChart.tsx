interface DonutChartProps {
  segments: { value: number; color: string; label: string }[];
  total: number;
  centerLabel?: string;
  size?: number;
}

export default function DonutChart({ segments, total, centerLabel, size = 160 }: DonutChartProps) {
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#f0f2f5"
          strokeWidth={stroke}
        />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dash = pct * circumference;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerLabel && (
          <span className="text-xs text-gray-400 mb-0.5">{centerLabel}</span>
        )}
        <span className="text-xl font-bold text-charcoal">{total}</span>
      </div>
    </div>
  );
}
