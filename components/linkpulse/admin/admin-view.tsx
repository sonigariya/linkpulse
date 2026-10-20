'use client'

import { useState, type FormEvent } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { Ban, CheckCircle2, Database, Gauge, Globe, Info, Plus, Server, ShieldAlert, ShieldOff, Timer, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SHORT_DOMAIN, formatNumber } from '@/lib/linkpulse/data'
import { useLinkPulse } from '../store'
import { Badge, Card, CardHeader, Input, PageHeader, Progress } from '../primitives'

function hostOf(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function AbuseQueue() {
  const { reports, links, updateLink, resolveReport, addBlockedDomain, blocklist, toast } = useLinkPulse()

  return (
    <Card className="border-destructive/20">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-destructive" />
            Suspicious & abusive links
            <Badge tone="danger">{reports.length}</Badge>
          </span>
        }
        description="Scanner and user reports, sorted by risk score."
      />
      <div className="flex items-start gap-2 border-b bg-muted/40 px-5 py-2.5 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Takedowns stop redirects instantly at the edge. Disabled links keep their full historical analytics for audit.
      </div>
      <ul className="divide-y">
        {[...reports]
          .sort((a, b) => b.riskScore - a.riskScore)
          .map((r) => {
            const link = links.find((l) => l.id === r.linkId)
            if (!link) return null
            const host = hostOf(link.destination)
            const down = link.disabledByAdmin
            const blocked = blocklist.includes(host)
            return (
              <li key={r.linkId} className={cn('flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center', down && 'bg-muted/30')}>
                <div
                  className={cn(
                    'flex size-11 shrink-0 flex-col items-center justify-center rounded-lg font-mono text-sm font-semibold',
                    r.riskScore >= 80 ? 'bg-destructive/10 text-destructive' : r.riskScore >= 50 ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground',
                  )}
                  aria-label={`Risk score ${r.riskScore}`}
                >
                  {r.riskScore}
                  <span className="text-[8px] font-normal uppercase tracking-wide">risk</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('font-mono text-[13px] font-medium', down && 'line-through')}>
                      {SHORT_DOMAIN}/{link.alias}
                    </span>
                    {down && <Badge tone="danger">Taken down</Badge>}
                    <span className="text-xs text-muted-foreground">
                      {r.reporter} · {r.reportedAt}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{link.destination}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.reasons.map((reason) => (
                      <Badge key={reason} tone={r.riskScore >= 80 ? 'danger' : 'warning'}>
                        {reason}
                      </Badge>
                    ))}
                    <Badge>{formatNumber(link.clicks)} clicks {down ? 'retained' : 'so far'}</Badge>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {!blocked && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        addBlockedDomain(host)
                        toast({ title: 'Domain blocklisted', description: host, tone: 'danger' })
                      }}
                    >
                      <Globe /> Block domain
                    </Button>
                  )}
                  {down ? (
                    <Button variant="ghost" size="sm" onClick={() => resolveReport(r.linkId)}>
                      <CheckCircle2 /> Close report
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => resolveReport(r.linkId)}>
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={() => {
                          updateLink(link.id, { disabledByAdmin: true, disabledReason: r.reasons[0] })
                          toast({
                            title: 'Link taken down',
                            description: `${SHORT_DOMAIN}/${link.alias} disabled. ${formatNumber(link.clicks)} clicks of history retained.`,
                            tone: 'danger',
                          })
                        }}
                      >
                        <Ban /> Takedown / Disable Immediately
                      </Button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        {reports.length === 0 && (
          <li className="flex flex-col items-center gap-2 px-5 py-12 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="size-6 text-success" />
            Queue is clear. Nice work.
          </li>
        )}
      </ul>
    </Card>
  )
}

const DOMAIN_RE = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/

function Blocklist() {
  const { blocklist, addBlockedDomain, removeBlockedDomain, toast } = useLinkPulse()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const d = draft.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (!DOMAIN_RE.test(d)) return setError('Enter a valid domain, e.g. scam-site.xyz')
    if (blocklist.includes(d)) return setError('Already on the blocklist')
    addBlockedDomain(d)
    toast({ title: 'Domain blocked', description: `New links to ${d} will be rejected.`, tone: 'danger' })
    setDraft('')
    setError(null)
  }

  return (
    <Card>
      <CardHeader title="Domain blocklist" description={`${blocklist.length} domains blocked platform-wide`} />
      <form onSubmit={submit} className="flex gap-2 border-b p-4">
        <Input
          aria-label="Domain to block"
          placeholder="malicious-domain.com"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
          aria-invalid={Boolean(error)}
          className="font-mono text-[13px]"
        />
        <Button type="submit" size="lg" variant="outline">
          <Plus /> Block
        </Button>
      </form>
      {error && <p className="px-4 pt-2 text-xs text-destructive">{error}</p>}
      <ul className="max-h-72 overflow-y-auto p-2">
        {blocklist.map((d) => (
          <li key={d} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60">
            <ShieldOff className="size-3.5 text-destructive" />
            <span className="flex-1 truncate font-mono text-[13px]">{d}</span>
            <button
              type="button"
              onClick={() => {
                removeBlockedDomain(d)
                toast({ title: 'Domain unblocked', description: d })
              }}
              className="rounded p-1 text-muted-foreground opacity-60 hover:bg-background hover:text-foreground group-hover:opacity-100"
            >
              <X className="size-3.5" />
              <span className="sr-only">Unblock {d}</span>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

const RATE_LIMITS = [
  { name: 'Link creation API', used: 742, limit: 1000, unit: 'req / min' },
  { name: 'Redirect edge (per IP)', used: 38, limit: 120, unit: 'req / min' },
  { name: 'Bulk import jobs', used: 4, limit: 5, unit: 'jobs / hour' },
  { name: 'Analytics export', used: 12, limit: 60, unit: 'req / hour' },
]

const LATENCY = [14, 12, 13, 11, 15, 12, 10, 11, 13, 12, 18, 11, 10, 12, 11, 9, 11, 12, 10, 11].map((v, i) => ({ i, v }))

const HEALTH = [
  { label: 'Redirect p50', value: '11 ms', icon: Zap, ok: true },
  { label: 'Edge uptime (30d)', value: '99.998%', icon: Server, ok: true },
  { label: 'Click queue depth', value: '1,204', icon: Database, ok: true },
  { label: 'Scanner backlog', value: '3 jobs', icon: Timer, ok: false },
]

function SystemHealth() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Gauge className="size-4 text-muted-foreground" /> Platform rate limiting
            </span>
          }
          description="Current window usage across the platform"
        />
        <ul className="flex flex-col gap-4 p-5">
          {RATE_LIMITS.map((r) => {
            const pct = (r.used / r.limit) * 100
            return (
              <li key={r.name}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span>{r.name}</span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {r.used}/{r.limit} {r.unit}
                  </span>
                </div>
                <Progress value={pct} color={pct >= 75 ? 'var(--warning)' : 'var(--success)'} />
              </li>
            )
          })}
        </ul>
      </Card>
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Server className="size-4 text-muted-foreground" /> System health
            </span>
          }
          action={<Badge tone="success">Operational</Badge>}
        />
        <div className="grid grid-cols-2 gap-3 p-5">
          {HEALTH.map((h) => (
            <div key={h.label} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">{h.label}</span>
                <h.icon className={cn('size-3.5', h.ok ? 'text-success' : 'text-warning')} />
              </div>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums">{h.value}</p>
            </div>
          ))}
        </div>
        <div className="px-5 pb-5">
          <p className="mb-1 text-[11px] text-muted-foreground">Redirect latency · last 20 min</p>
          <div className="h-14">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={LATENCY} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <Area type="monotone" dataKey="v" stroke="var(--success)" fill="var(--success)" fillOpacity={0.12} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function AdminView() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin Governance & Safety"
        description="Moderate abuse, manage blocked domains and monitor platform health."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <AbuseQueue />
        <Blocklist />
      </div>
      <SystemHealth />
    </div>
  )
}
