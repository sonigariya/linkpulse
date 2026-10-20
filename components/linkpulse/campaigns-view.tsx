'use client'

import { useState } from 'react'
import { Folder, FolderPlus, Link2, MousePointerClick, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SHORT_DOMAIN, compactNumber, formatNumber, getLinkStatus } from '@/lib/linkpulse/data'
import { useLinkPulse } from './store'
import { Card, Field, Input, Modal, PageHeader, Progress } from './primitives'

const PALETTE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export function CampaignsView() {
  const { campaigns, links, addCampaign, setTab, toast } = useLinkPulse()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('10000')

  const nameTaken = campaigns.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())
  const canCreate = name.trim().length >= 2 && !nameTaken && Number(goal) > 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Campaigns & Folders"
        description="Group links by initiative and track reach against goals."
        actions={
          <Button size="lg" variant="outline" onClick={() => setOpen(true)}>
            <FolderPlus /> New campaign
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {campaigns.map((c) => {
          const cLinks = links.filter((l) => l.campaign === c.name)
          const clicks = cLinks.reduce((a, b) => a + b.clicks, 0)
          const top = [...cLinks].sort((a, b) => b.clicks - a.clicks)[0]
          const active = cLinks.filter((l) => getLinkStatus(l) === 'active').length
          const reach = (clicks / c.goal) * 100
          return (
            <Card key={c.name} className="flex flex-col overflow-hidden">
              <div className="h-1" style={{ background: c.color }} aria-hidden />
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Folder className="size-4" style={{ color: c.color }} />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{c.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {active} active of {cLinks.length}
                      </p>
                    </div>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/60 px-3 py-2">
                    <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Link2 className="size-3" /> Total links
                    </dt>
                    <dd className="font-mono text-lg font-semibold tabular-nums">{cLinks.length}</dd>
                  </div>
                  <div className="rounded-lg bg-muted/60 px-3 py-2">
                    <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MousePointerClick className="size-3" /> Total clicks
                    </dt>
                    <dd className="font-mono text-lg font-semibold tabular-nums">{compactNumber(clicks)}</dd>
                  </div>
                </dl>

                <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <Trophy className="size-3.5 shrink-0 text-warning" />
                  {top ? (
                    <>
                      <span className="truncate font-mono text-xs">
                        {SHORT_DOMAIN}/{top.alias}
                      </span>
                      <span className="ml-auto font-mono text-xs text-muted-foreground">{compactNumber(top.clicks)}</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No links yet</span>
                  )}
                </div>

                <div className="mt-auto">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Campaign reach</span>
                    <span className="font-mono tabular-nums">
                      {formatNumber(clicks)} / {compactNumber(c.goal)}
                      <span className="ml-1.5 text-muted-foreground">{Math.round(reach)}%</span>
                    </span>
                  </div>
                  <Progress value={reach} color={c.color} />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title="New campaign"
        description="Campaigns appear in the link creation wizard."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="lg"
              disabled={!canCreate}
              onClick={async() => {
                const ok = await addCampaign({ name: name.trim(), goal: Number(goal), color: PALETTE[campaigns.length % PALETTE.length] })
                if (!ok) return
                toast({ title: 'Campaign created', description: name.trim(), tone: 'success' })
                setName('')
                setOpen(false)
              }}
            >
              Create campaign
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Name" htmlFor="cname" hint={nameTaken ? <span className="text-destructive">A campaign with this name exists.</span> : undefined}>
            <Input id="cname" autoFocus placeholder="Holi Weekend 2027" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Click goal" htmlFor="cgoal">
            <Input id="cgoal" type="number" min={1} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </Field>
          <button type="button" onClick={() => { setOpen(false); setTab('links') }} className="self-start text-xs text-brand hover:underline">
            Or go create links first →
          </button>
        </div>
      </Modal>
    </div>
  )
}
