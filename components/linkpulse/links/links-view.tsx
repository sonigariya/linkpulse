'use client'

import { useMemo, useState } from 'react'
import {
  Ban,
  Check,
  Copy,
  CornerDownRight,
  Lock,
  MousePointerClick,
  Plus,
  QrCode,
  RotateCcw,
  Search,
  ExternalLink,
  SlidersHorizontal,
  Smartphone,
  Link2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SHORT_DOMAIN, brandedShort, compactNumber, formatNumber, getLinkStatus, workingShortUrl, type LinkStatus, type ShortLink } from '@/lib/linkpulse/data'
import { useLinkPulse } from '../store'
import { useOrigin } from '../use-origin'
import { Badge, Card, PageHeader, Select, StatusBadge } from '../primitives'
import { LinkWizard } from './create-link-wizard'
import { QrModal } from './qr-modal'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const { toast } = useLinkPulse()
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          // Clipboard can be blocked inside iframes; the visual confirmation still helps the demo.
        }
        setCopied(true)
        toast({ title: 'Copied to clipboard', description: text })
        setTimeout(() => setCopied(false), 1500)
      }}
      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      <span className="sr-only">Copy short link</span>
    </button>
  )
}

function Favicon({ url }: { url: string }) {
  let letter = '?'
  try {
    letter = new URL(url).hostname.replace('www.', '')[0]?.toUpperCase() ?? '?'
  } catch {}
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold text-muted-foreground" aria-hidden>
      {letter}
    </span>
  )
}

const STATUS_FILTERS: { value: 'all' | LinkStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'capped', label: 'Click Cap Reached' },
  { value: 'disabled', label: 'Disabled by Admin' },
]

export function LinksView({ onOpenQr }: { onOpenQr?: (link: any) => void }) {
  const { links, campaigns, updateLink, toast } = useLinkPulse()
  const origin = useOrigin()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editing, setEditing] = useState<ShortLink | null>(null)
  const [qrLink, setQrLink] = useState<ShortLink | null>(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | LinkStatus>('all')
  const [campaign, setCampaign] = useState('all')
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return links.filter((l) => {
      if (status !== 'all' && getLinkStatus(l) !== status) return false
      if (campaign !== 'all' && l.campaign !== campaign) return false
      if (!q) return true
      return l.alias.includes(q) || l.destination.toLowerCase().includes(q) || l.tags.some((t) => t.includes(q))
    })
  }, [links, query, status, campaign])

  const counts = useMemo(() => {
    const c = { active: 0, total: links.length, clicks: 0 }
    for (const l of links) {
      if (getLinkStatus(l) === 'active') c.active++
      c.clicks += l.clicks
    }
    return c
  }, [links])

  async function toggleDisabled(link: ShortLink) {
    const next = !link.disabledByAdmin
    const ok = await updateLink(link.id, { disabledByAdmin: next, disabledReason: next ? 'Manually disabled' : undefined })
    if (!ok) return
    toast({
      title: next ? 'Link disabled' : 'Link re-enabled',
      description: next ? 'Redirects stopped. Historical analytics are retained.' : `${SHORT_DOMAIN}/${link.alias} is live again.`,
      tone: next ? 'danger' : 'success',
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Links"
        description="Create governed short links and manage every redirect in your workspace."
        actions={
          <Button
            size="lg"
            className="bg-brand px-4 text-brand-foreground shadow-sm hover:bg-brand/90"
            onClick={() => {
              setEditing(null)
              setWizardOpen(true)
            }}
          >
            <Plus /> Create Short Link
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total links', value: formatNumber(counts.total), icon: Link2 },
          { label: 'Active', value: formatNumber(counts.active), icon: Check },
          { label: 'Lifetime clicks', value: compactNumber(counts.clicks), icon: MousePointerClick },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 px-4 py-3">
            <s.icon className="hidden size-4 text-muted-foreground sm:block" />
            <div>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="font-mono text-lg font-semibold tabular-nums">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search links"
              placeholder="Search by alias, destination or tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="hidden size-4 text-muted-foreground sm:block" />
            <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="sm:w-44">
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by campaign" value={campaign} onChange={(e) => setCampaign(e.target.value)} className="sm:w-44">
              <option value="all">All campaigns</option>
              {campaigns.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-2.5 font-medium">Short link</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Clicks</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Campaign · Tags</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((link) => {
                const s = getLinkStatus(link)
                const capPct = link.maxClicks ? Math.min(100, (link.clicks / link.maxClicks) * 100) : null
                return (
                  <tr
                    key={link.id}
                    className={cn(
                      'border-b transition-colors last:border-0 hover:bg-muted/40',
                      highlightId === link.id && 'bg-brand/5',
                      s === 'disabled' && 'opacity-80',
                    )}
                  >
                    <td className="max-w-[380px] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Favicon url={link.destination} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className={cn('font-mono text-[13px] font-medium', s === 'disabled' && 'line-through decoration-destructive/60')}>
                              {brandedShort(link.alias)}
                            </span>
                            <CopyButton text={origin ? workingShortUrl(origin, link.alias) : brandedShort(link.alias)} />
                            {origin && (
                              <a
                                href={workingShortUrl(origin, link.alias)}
                                target="_blank"
                                rel="noreferrer"
                                title="Open / Test Redirect"
                                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                              
                              <ExternalLink className="size-3.5" />
          <span className="sr-only">Open / Test Redirect</span>
        </a>
      )}             
                          
                            {link.password && <Lock className="size-3 text-muted-foreground" aria-label="Password protected" />}
                            {(link.mobileUrl || link.desktopUrl) && (
                              <Smartphone className="size-3 text-muted-foreground" aria-label="Device targeting" />
                            )}
                            {highlightId === link.id && <Badge tone="brand">New</Badge>}
                          </div>
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground" title={link.destination}>
                            <CornerDownRight className="size-3 shrink-0" />
                            <span className="truncate">{link.destination}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={s} />
                        {link.expiresAt && s !== 'expired' && <span className="text-[11px] text-muted-foreground">Expires {link.expiresAt}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono tabular-nums">{formatNumber(link.clicks)}</span>
                        {capPct !== null && (
                          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="h-1 w-12 overflow-hidden rounded-full bg-muted">
                              <span
                                className={cn('block h-full rounded-full', capPct >= 100 ? 'bg-warning' : 'bg-brand')}
                                style={{ width: `${capPct}%` }}
                              />
                            </span>
                            {compactNumber(link.maxClicks!)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge tone="brand">{link.campaign}</Badge>
                        {link.tags.map((t) => (
                          <span key={t} className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setQrLink(link)} title="Download QR code">
                          <QrCode />
                          <span className="sr-only">Download QR code</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(link)
                            setWizardOpen(true)
                          }}
                        >
                          Edit rules
                        </Button>
                        {link.disabledByAdmin ? (
                          <Button variant="outline" size="sm" onClick={() => toggleDisabled(link)}>
                            <RotateCcw /> Enable
                          </Button>
                        ) : (
                          <Button variant="destructive" size="sm" onClick={() => toggleDisabled(link)}>
                            <Ban /> Disable
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-sm text-muted-foreground">
                    No links match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">
          Showing {filtered.length} of {links.length} links
        </div>
      </Card>

      <LinkWizard
        open={wizardOpen}
        editing={editing}
        onClose={() => setWizardOpen(false)}
        onCreated={(id) => {
          setQuery('')
          setStatus('all')
          setCampaign('all')
          setHighlightId(id)
        }}
      />
      <QrModal link={qrLink} onClose={() => setQrLink(null)} />
    </div>
  )
}
