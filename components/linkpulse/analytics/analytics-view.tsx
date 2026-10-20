'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Bot, Globe2, Link2, MousePointerClick, Pause, Play, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SHORT_DOMAIN, formatNumber, getLinkStatus } from '@/lib/linkpulse/data'
import { getAnalytics, initialEvents, liveRandom, makeEvent, type ClickEvent, type Period } from '@/lib/linkpulse/analytics'
import { useLinkPulse } from '../store'
import { Badge, Card, CardHeader, PageHeader, Segmented, Select } from '../primitives'
import { BrowserBars, ClicksChart, DeviceDonut, RankedList } from './charts'
import { setEventSettings } from 'recharts/types/state/eventSettingsSlice'

function Kpi({
  label,
  value,
  delta,
  icon: Icon,
  invert,
  accent,
}: {
  label: string
  value: string
  delta?: number
  icon: typeof Users
  invert?: boolean
  accent?: boolean
}) {
  const good = delta === undefined ? true : invert ? delta < 0 : delta >= 0
  return (
    <Card className={cn('p-4', accent && 'border-destructive/20')}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={cn('size-4', accent ? 'text-destructive' : 'text-muted-foreground')} />
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {delta !== undefined && (
        <p className={cn('mt-1 inline-flex items-center gap-0.5 text-xs font-medium', good ? 'text-success' : 'text-destructive')}>
          {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
          {Math.abs(delta)}% <span className="font-normal text-muted-foreground">vs prev. period</span>
        </p>
      )}
    </Card>
  )
}

function LiveStream({ events }: { events: ClickEvent[] }) {
  const [paused, setPaused] = useState(false)

  

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <span className="relative flex size-2">
              {!paused && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />}
              <span className={cn('relative inline-flex size-2 rounded-full', paused ? 'bg-muted-foreground' : 'bg-success')} />
            </span>
            Live click event stream
          </span>
        }
        description="Bot and abuse traffic is filtered before it reaches your totals."
        action={
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted"
          >
            {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
            {paused ? 'Resume' : 'Pause'}
          </button>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              {['Time', 'Short link', 'Location', 'Device', 'Browser', 'Referrer', 'Filter'].map((h) => (
                <th key={h} scope="col" className="px-4 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e, i) => (
              <tr
                key={e.id}
                className={cn(
                  'border-b last:border-0',
                  i === 0 && !paused && 'animate-in fade-in-0 slide-in-from-top-1',
                  e.bot && 'bg-destructive/[0.03]',
                )}
              >
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{e.timestamp}</td>
                <td className="px-4 py-2 font-mono text-[13px]">
                  {SHORT_DOMAIN}/{e.alias}
                </td>
                <td className="px-4 py-2">{e.location}</td>
                <td className="px-4 py-2">{e.device}</td>
                <td className="px-4 py-2 text-muted-foreground">{e.browser}</td>
                <td className="px-4 py-2 text-muted-foreground">{e.referrer}</td>
                <td className="px-4 py-2">
                  {e.bot ? (
                    <Badge tone="danger">
                      <Bot className="size-3" /> Bot filtered
                    </Badge>
                  ) : (
                    <Badge tone="success">Human</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function AnalyticsView() {
  const { links, campaigns } = useLinkPulse()
  const [period, setPeriod] = useState<Period>('7d')
  const [campaign, setCampaign] = useState('all')

  const data = useMemo(
    () => getAnalytics(initialEvents, links, period, campaign),
    [links, period, campaign],
  )

  const filteredLinks = links.filter((l) => campaign === 'all' || l.campaign === campaign)
  const activeLinks = filteredLinks.filter((l) => getLinkStatus(l) === 'active').length

  
  const realTotalClicks = filteredLinks.reduce(
    (sum, l: any) => sum + (l.clicks ?? l.totalClicks ?? l.clickCount ?? 0),
    0,
  )
  const realUniqueClicks = filteredLinks.reduce(
    (sum, l: any) => sum + (l.uniqueClicks ?? l.unique ?? (l.clicks > 0 ? 1 : 0)),
    0,
  )

  
  
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        description="Real-time click intelligence across every short link."
        actions={
          <>
            <Select aria-label="Campaign" value={campaign} onChange={(e) => setCampaign(e.target.value)} className="w-48">
              <option value="all">All campaigns</option>
              {campaigns.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </Select>
            <Segmented<Period>
              label="Date period"
              value={period}
              onChange={setPeriod}
              options={[
                { value: '24h', label: '24h' },
                { value: '7d', label: '7d' },
                { value: '30d', label: '30d' },
              ]}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total clicks" value={formatNumber(realTotalClicks)} delta={data.kpis.clicksDelta} icon={MousePointerClick} />
        <Kpi label="Unique visitors" value={formatNumber(realUniqueClicks)} delta={data.kpis.uniqueDelta} icon={Users} />
        <Kpi label="Active links" value={formatNumber(activeLinks)} icon={Link2} />
        <Kpi label="Blocked bot / abuse" value={formatNumber(data.kpis.bots)} delta={data.kpis.botsDelta} icon={Bot} invert accent />
      </div>

      <Card>
        <CardHeader
          title="Clicks over time"
          description={period === '24h' ? 'Hourly, last 24 hours' : `Daily, last ${period === '7d' ? '7' : '30'} days`}
          action={
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded bg-[var(--chart-1)]" /> Clicks
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-3 rounded bg-[var(--chart-2)]" /> Unique
              </span>
            </div>
          }
        />
        <div className="px-2 py-4">
          <ClicksChart data={data.series} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Devices" description="Share of clicks by device type" />
          <div className="p-5">
            <DeviceDonut data={data.devices} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Browsers" description="Top browsers by clicks" />
          <div className="p-4">
            <BrowserBars data={data.browsers} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Top referrers" />
          <div className="p-3">
            <RankedList data={data.referrers} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Top locations" />
          <div className="p-3">
            <RankedList
              data={data.locations}
              icon={(d) => (
                <span className="relative flex h-4 w-6 items-center justify-center rounded-sm border bg-background font-mono text-[9px] font-semibold text-muted-foreground">
                  {d.code ?? <Globe2 className="size-3" />}
                </span>
              )}
            />
          </div>
        </Card>
      </div>

      <LiveStream events={initialEvents} />
    </div>
  )
}
