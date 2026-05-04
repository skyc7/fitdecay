import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Baseline, Layoff, UserProfile } from "../types";
import { calculateBaselineDecay } from "../lib/calculations";
import { daysBetween } from "../lib/date";

export function DecayChart({
  baseline,
  layoff,
  profile,
  height = 160,
}: {
  baseline: Baseline;
  layoff: Layoff;
  profile: UserProfile;
  height?: number;
}) {
  const totalDays = Math.max(14, daysBetween(layoff.startDate, layoff.endDate) + (layoff.endDate ? 0 : 28));
  const todayDay = daysBetween(layoff.startDate, null);
  const data = Array.from({ length: Math.ceil(totalDays / 3) + 1 }, (_, index) => {
    const day = Math.min(totalDays, index * 3);
    const result = calculateBaselineDecay(baseline, day, profile, layoff);
    return { day, value: Number(result.predicted.toFixed(1)), loss: Number(result.percentLost.toFixed(1)) };
  });

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} domain={["dataMin", "dataMax"]} width={36} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12 }}
            labelFormatter={(day) => `Day ${day}`}
            formatter={(value, name) => [value, name === "value" ? baseline.unit : "loss"]}
          />
          <ReferenceLine x={todayDay} stroke="#fb923c" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
