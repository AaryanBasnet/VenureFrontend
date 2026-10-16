import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Brand colours (see src/styles/theme.css): gold line on cream gridlines.
const GOLD = "#b8963c";
const GRID = "#e2d5bf";
const MUTED = "#6e655a";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-card-sm border border-line bg-white px-3 py-2 shadow-md">
      <p className="font-body text-caption text-taupe">{label}</p>
      <p className="font-display text-h5 font-light text-ink">NPR {Number(payload[0].value).toLocaleString("en-IN")}</p>
    </div>
  );
}

// Monthly booked value. Needs a parent with a fixed height.
export default function MonthlyEarningsChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={GOLD} stopOpacity={0.35} />
            <stop offset="95%" stopColor={GOLD} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} width={44} tick={{ fill: MUTED, fontSize: 12 }} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID }} />
        <Area type="monotone" dataKey="totalEarnings" stroke={GOLD} strokeWidth={2.5} fill="url(#earningsGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
