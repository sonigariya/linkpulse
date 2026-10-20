'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { compactNumber, formatNumber } from '@/lib/linkpulse/data'

type TooltipPayload = { name?: string; value?: number; color?: string; payload?: { fill?: string } }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-mono tabular-nums">{formatNumber(p.value ?? 0)}</span>
        </div>
      ))}
    </div>
  )
}

export function ClicksChart({ data }: { data: { label: string; clicks: number; unique: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickFormatter={compactNumber} width={48} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--border)' }} />
        <Area type="monotone" dataKey="clicks" name="Clicks" stroke="var(--chart-1)" strokeWidth={2} fill="url(#clicksFill)" />
        <Area type="monotone" dataKey="unique" name="Unique" stroke="var(--chart-2)" strokeWidth={2} fill="transparent" strokeDasharray="4 3" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function DeviceDonut({ data }: { data: { name: string; value: number; fill: string }[] }) {
  const total = data.reduce((a, b) => a + b.value, 0)
  return (
    <div className="flex items-center gap-5">
      <div className="relative size-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={46} outerRadius={68} paddingAngle={2} strokeWidth={0}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-base font-semibold">{compactNumber(total)}</span>
          <span className="text-[10px] text-muted-foreground">clicks</span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-2.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-sm" style={{ background: d.fill }} />
            {d.name}
            <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BrowserBars({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={150}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={64} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--muted)' }} />
        <Bar dataKey="value" name="Clicks" fill="var(--chart-1)" radius={[0, 4, 4, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function RankedList({ data, icon }: { data: { name: string; value: number; code?: string }[]; icon?: (d: { code?: string }) => React.ReactNode }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <ul className="flex flex-col gap-1.5">
      {data.map((d) => (
        <li key={d.name} className="relative flex items-center gap-2 overflow-hidden rounded-md px-2.5 py-1.5 text-sm">
          <span className="absolute inset-y-0 left-0 rounded-md bg-brand/8" style={{ width: `${(d.value / max) * 100}%` }} aria-hidden />
          {icon?.(d)}
          <span className="relative truncate">{d.name}</span>
          <span className="relative ml-auto font-mono text-xs tabular-nums text-muted-foreground">{formatNumber(d.value)}</span>
        </li>
      ))}
    </ul>
  )
}
