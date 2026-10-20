'use client'

import { useMemo, useRef, useState, type DragEvent } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, ShieldAlert, Trash2, UploadCloud, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SHORT_DOMAIN, checkUrl, slugify, type ShortLink } from '@/lib/linkpulse/data'
import { useLinkPulse } from './store'
import { Badge, Card, CardHeader, PageHeader } from './primitives'

type Row = { line: number; url: string; alias: string; campaign: string; tags: string[] }
type Issue = { tone: 'success' | 'warning' | 'danger'; label: string }

const SAMPLE_CSV = `url,alias,campaign,tags
https://shop.example.com/diwali/lights,diwali-lights,Diwali Sale 2026,sale;decor
https://shop.example.com/diwali/sweets,diwali-sweets,Diwali Sale 2026,sale;food
https://product.example.com/changelog,launch-v3,Product Launch,launch
htps//broken-link,broken,Newsletter,misc
http://free-giftz-claim.xyz/iphone,iphone-win,Newsletter,promo
https://careers.example.com/campus/iit-b,campus-iitb,Campus Drive,hiring
https://careers.example.com/campus/iit-d,campus-iitb,Campus Drive,hiring
http://events.example.com/diwali-meetup,diwali-meetup,Diwali Sale 2026,event`

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return []
  const header = lines[0].toLowerCase().split(',').map((h) => h.trim())
  const hasHeader = header.includes('url')
  const idx = (k: string, fallback: number) => (hasHeader ? header.indexOf(k) : fallback)
  const [iu, ia, ic, it] = [idx('url', 0), idx('alias', 1), idx('campaign', 2), idx('tags', 3)]
  return lines.slice(hasHeader ? 1 : 0, 501).map((line, i) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    return {
      line: i + (hasHeader ? 2 : 1),
      url: cols[iu] ?? '',
      alias: slugify(cols[ia] ?? ''),
      campaign: cols[ic] || 'Newsletter',
      tags: (cols[it] ?? '').split(/[;|]/).map(slugify).filter(Boolean),
    }
  })
}

export function BulkImportView() {
  const { links, blocklist, importRows, toast, setTab } = useLinkPulse()
  const [rows, setRows] = useState<Row[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validated = useMemo(() => {
    const seen = new Map<string, number>()
    return rows.map((r) => {
      const issues: Issue[] = []
      const check = checkUrl(r.url, blocklist)
      if (check.state === 'invalid' || check.state === 'empty') issues.push({ tone: 'danger', label: 'Invalid URL Format' })
      if (check.state === 'unsafe') issues.push({ tone: 'danger', label: 'Unsafe Domain Blocked' })
      if (r.alias && (links.some((l) => l.alias === r.alias) || seen.has(r.alias))) {
        issues.push({ tone: 'warning', label: 'Duplicate Alias Detected' })
      }
      if (r.alias) seen.set(r.alias, r.line)
      const nonBlocking = check.state === 'warning'
      return { ...r, issues, valid: issues.length === 0, insecure: nonBlocking }
    })
  }, [rows, links, blocklist])

  const validCount = validated.filter((r) => r.valid).length
  const errorCount = validated.length - validCount

  function readFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      toast({ title: 'Unsupported file', description: 'Please upload a .csv file.', tone: 'danger' })
      return
    }
    if (file.size > 2_000_000) {
      toast({ title: 'File too large', description: 'Max 2 MB / 500 rows per import.', tone: 'danger' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setRows(parseCsv(String(reader.result)))
      setFileName(file.name)
    }
    reader.readAsText(file)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }

  function importValid() {
    const used = new Set(links.map((l) => l.alias))
    const newLinks: ShortLink[] = validated
      .filter((r) => r.valid)
      .map((r, i) => {
        let alias = r.alias || Math.random().toString(36).slice(2, 9)
        while (used.has(alias)) alias = Math.random().toString(36).slice(2, 9)
        used.add(alias)
        return {
          id: `bulk-${Date.now()}-${i}`,
          alias,
          destination: r.url,
          campaign: r.campaign,
          tags: r.tags,
          clicks: 0,
          createdAt: '2026-10-18',
          expiresAt: null,
          maxClicks: null,
          password: null,
          mobileUrl: null,
          desktopUrl: null,
          disabledByAdmin: false,
        }
      })
    addLinks(newLinks)
    toast({
      title: `Imported ${newLinks.length} links`,
      description: errorCount ? `${errorCount} problem rows skipped.` : 'All rows imported.',
      tone: 'success',
    })
    setRows([])
    setFileName(null)
    setTab('links')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Bulk CSV Import" description="Upload up to 500 links at once. Every row is validated before import." />

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors',
          dragging ? 'border-brand bg-brand/5' : 'border-border bg-muted/30',
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-background ring-1 ring-border">
          <UploadCloud className={cn('size-5', dragging ? 'text-brand' : 'text-muted-foreground')} />
        </div>
        <p className="mt-4 text-sm font-medium">Drag & drop your CSV here</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Columns: <span className="font-mono">url, alias, campaign, tags</span> · tags separated by <span className="font-mono">;</span>
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button size="lg" variant="outline" onClick={() => inputRef.current?.click()}>
            Browse files
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => {
              setRows(parseCsv(SAMPLE_CSV))
              setFileName('diwali-campaign-links.csv')
            }}
          >
            <FileSpreadsheet /> Load sample CSV
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          aria-label="Upload CSV file"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) readFile(f)
            e.target.value = ''
          }}
        />
      </div>

      {validated.length > 0 && (
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-muted-foreground" />
                Validation preview · <span className="font-mono font-normal">{fileName}</span>
              </span>
            }
            description={
              <span className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 text-success">
                  <CheckCircle2 className="size-3.5" /> {validCount} valid
                </span>
                <span className="inline-flex items-center gap-1 text-destructive">
                  <XCircle className="size-3.5" /> {errorCount} need attention
                </span>
              </span>
            }
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRows([])
                  setFileName(null)
                }}
              >
                <Trash2 /> Clear
              </Button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="w-10 px-4 py-2 font-medium">#</th>
                  <th scope="col" className="px-4 py-2 font-medium">Destination URL</th>
                  <th scope="col" className="px-4 py-2 font-medium">Alias</th>
                  <th scope="col" className="px-4 py-2 font-medium">Campaign</th>
                  <th scope="col" className="px-4 py-2 font-medium">Validation</th>
                </tr>
              </thead>
              <tbody>
                {validated.map((r) => {
                  const worst = r.issues.find((i) => i.tone === 'danger') ? 'danger' : r.issues.length ? 'warning' : null
                  return (
                    <tr
                      key={r.line}
                      className={cn(
                        'border-b last:border-0',
                        worst === 'danger' && 'bg-destructive/[0.05]',
                        worst === 'warning' && 'bg-warning/[0.08]',
                      )}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.line}</td>
                      <td className="max-w-[320px] truncate px-4 py-2.5 font-mono text-[13px]" title={r.url}>
                        {r.url || <span className="text-muted-foreground">(empty)</span>}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[13px]">{r.alias ? `${SHORT_DOMAIN}/${r.alias}` : <span className="text-muted-foreground">auto</span>}</td>
                      <td className="px-4 py-2.5">{r.campaign}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {r.valid && (
                            <Badge tone="success">
                              <CheckCircle2 className="size-3" /> Valid
                            </Badge>
                          )}
                          {r.valid && r.insecure && <Badge tone="neutral">HTTP</Badge>}
                          {r.issues.map((i) => (
                            <Badge key={i.label} tone={i.tone}>
                              {i.label === 'Unsafe Domain Blocked' ? (
                                <ShieldAlert className="size-3" />
                              ) : i.tone === 'danger' ? (
                                <XCircle className="size-3" />
                              ) : (
                                <AlertTriangle className="size-3" />
                              )}
                              {i.label}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t bg-muted/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Problem rows are skipped. Fix them in your CSV and re-upload anytime.</p>
            <Button size="lg" className="bg-brand px-4 text-brand-foreground hover:bg-brand/90" disabled={!validCount} onClick={importValid}>
              Import {validCount} valid links only
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
