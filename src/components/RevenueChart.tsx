import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../theme/useTheme'
import { palettes } from '../theme/tokens'
import { formatGnf, formatMonth } from '../lib/format'
import type { RevenuePoint } from '../api/types'

/** Courbe des revenus sur 12 mois (aire + trait primary). */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const { theme } = useTheme()
  const c = palettes[theme]
  const points = data.map((d) => ({
    monthLabel: d.month ? formatMonth(d.month) : '',
    revenueGnf: d.revenueGnf ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={points} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.primary} stopOpacity={0.22} />
            <stop offset="100%" stopColor={c.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="monthLabel"
          tickLine={false}
          axisLine={false}
          tick={{ fill: c.textFaint, fontSize: 11 }}
          interval={0}
        />
        <YAxis hide domain={['dataMin - 4000000', 'dataMax + 4000000']} />
        <Tooltip
          cursor={{ stroke: c.border }}
          contentStyle={{
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            fontSize: 12,
            color: c.text,
          }}
          labelStyle={{ color: c.textMuted, fontWeight: 700 }}
          formatter={(value) => [formatGnf(Number(value)), 'Revenus'] as [string, string]}
        />
        <Area
          type="monotone"
          dataKey="revenueGnf"
          stroke={c.primary}
          strokeWidth={2.5}
          fill="url(#revFill)"
          dot={false}
          activeDot={{ r: 4, fill: c.primary }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
