'use client'

import { useState, type KeyboardEvent } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  Monitor,
  ShieldAlert,
  Shuffle,
  Smartphone,
  X,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RESERVED_ALIASES, SHORT_DOMAIN, brandedShort, checkUrl, slugify, workingShortUrl, type ShortLink } from '@/lib/linkpulse/data'
import { useLinkPulse } from '../store'
import { useOrigin } from '../use-origin'
import { Badge, Field, Input, Modal, Select, Switch } from '../primitives'

type AliasState = 'idle' | 'checking' | 'available' | 'taken' | 'reserved'

function randomAlias() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function UrlStatus({ value }: { value: string }) {
  const { blocklist } = useLinkPulse()
  const check = checkUrl(value, blocklist)
  if (check.state === 'empty') return null
  if (check.state === 'valid')
    return (
      <Badge tone="success">
        <CheckCircle2 className="size-3" /> Safe destination · {check.hostname}
      </Badge>
    )
  if (check.state === 'warning')
    return (
      <Badge tone="warning">
        <AlertTriangle className="size-3" /> {check.message}
      </Badge>
    )
  if (check.state === 'unsafe')
    return (
      <Badge tone="danger">
        <ShieldAlert className="size-3" /> {check.message}
      </Badge>
    )
  return (
    <Badge tone="danger">
      <XCircle className="size-3" /> {check.message}
    </Badge>
  )
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = ['Destination', 'Rules & Governance']
  return (
    <ol className="mb-6 flex items-center gap-3">
      {steps.map((label, i) => {
        const n = i + 1
        const done = step > n
        const current = step === n
        return (
          <li key={label} className="flex flex-1 items-center gap-3">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                done && 'bg-success text-white',
                current && 'bg-foreground text-background',
                !done && !current && 'bg-muted text-muted-foreground',
              )}
            >
              {done ? <Check className="size-3.5" /> : n}
            </span>
            <span className={cn('text-xs font-medium', current ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            {n === 1 && <span className="h-px flex-1 bg-border" aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}

export function LinkWizard({
  open,
  onClose,
  editing,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  editing?: ShortLink | null
  onCreated?: (id: string) => void
}) {
  if (!open) return null
  return <WizardBody key={editing?.id ?? 'new'} onClose={onClose} editing={editing ?? null} onCreated={onCreated} />
}

function WizardBody({
  onClose,
  editing,
  onCreated,
}: {
  onClose: () => void
  editing: ShortLink | null
  onCreated?: (id: string) => void
}) {
  const { links, campaigns, blocklist, addLinks, updateLink, toast } = useLinkPulse()
  const origin = useOrigin()
  const isEdit = Boolean(editing)
  const [saving, setSaving] = useState(false)

  const [step, setStep] = useState<1 | 2>(isEdit ? 2 : 1)
  const [destination, setDestination] = useState(editing?.destination ?? '')
  const [alias, setAlias] = useState(editing?.alias ?? '')
  const [aliasState, setAliasState] = useState<AliasState>(isEdit ? 'available' : 'idle')
  const [campaign, setCampaign] = useState(editing?.campaign ?? campaigns[0]?.name ?? '')
  const [tags, setTags] = useState<string[]>(editing?.tags ?? [])
  const [tagDraft, setTagDraft] = useState('')

  const [expiresAt, setExpiresAt] = useState(editing?.expiresAt ?? '')
  const [maxClicks, setMaxClicks] = useState(editing?.maxClicks?.toString() ?? '')
  const [passwordOn, setPasswordOn] = useState(Boolean(editing?.password))
  const [password, setPassword] = useState(editing?.password ?? '')
  const [targetingOn, setTargetingOn] = useState(Boolean(editing?.mobileUrl || editing?.desktopUrl))
  const [mobileUrl, setMobileUrl] = useState(editing?.mobileUrl ?? '')
  const [desktopUrl, setDesktopUrl] = useState(editing?.desktopUrl ?? '')

  const urlCheck = checkUrl(destination, blocklist)
  const urlOk = urlCheck.state === 'valid' || urlCheck.state === 'warning'
  const aliasOk = alias === '' || aliasState === 'available'
  const finalAlias = alias || 'your-link'
  const shortUrl = origin ? workingShortUrl(origin, finalAlias) : brandedShort(finalAlias)

  const mobileCheck = checkUrl(mobileUrl, blocklist)
  const desktopCheck = checkUrl(desktopUrl, blocklist)
  const targetingValid =
    !targetingOn ||
    ((mobileCheck.state === 'empty' || mobileCheck.state === 'valid' || mobileCheck.state === 'warning') &&
      (desktopCheck.state === 'empty' || desktopCheck.state === 'valid' || desktopCheck.state === 'warning'))
  const passwordValid = !passwordOn || password.length >= 4
  const maxClicksValid = maxClicks === '' || (Number.isInteger(Number(maxClicks)) && Number(maxClicks) > 0)

  function onAliasChange(v: string) {
    setAlias(slugify(v))
    setAliasState('idle')
  }

  function checkAvailability() {
    if (!alias) return
    setAliasState('checking')
    setTimeout(() => {
      if (RESERVED_ALIASES.includes(alias)) setAliasState('reserved')
      else if (links.some((l) => l.alias === alias)) setAliasState('taken')
      else setAliasState('available')
    }, 550)
  }

  function addTag() {
    const t = slugify(tagDraft)
    if (t && !tags.includes(t) && tags.length < 6) setTags([...tags, t])
    setTagDraft('')
  }

  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !tagDraft && tags.length) {
      setTags(tags.slice(0, -1))
    }
  }

  function goNext() {
    if (!alias) {
      let generated = randomAlias()
      while (links.some((l) => l.alias === generated)) generated = randomAlias()
      setAlias(generated)
      setAliasState('available')
    }
    setStep(2)
  }

  async function submit() {
    const rules = {
      expiresAt: expiresAt || null,
      maxClicks: maxClicks ? Number(maxClicks) : null,
      password: passwordOn ? password : null,
      mobileUrl: targetingOn && mobileUrl ? mobileUrl : null,
      desktopUrl: targetingOn && desktopUrl ? desktopUrl : null,
    }
    setSaving(true)
    try {
      if (editing) {
        const ok = await updateLink(editing.id, { destination, campaign, tags, ...rules })
        if (!ok) return
        toast({ title: 'Rules updated', description: brandedShort(editing.alias), tone: 'success' })
        onClose()
        return
      }
      const id = await addLinks([
        {
          alias,
          destination,
          campaign,
          tags,
          disabledByAdmin: false,
          ...rules,
        },
      ])
      if (!id) return
      toast({ title: 'Short link created', description: brandedShort(alias), tone: 'success' })
      onCreated?.(id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit rules · ${SHORT_DOMAIN}/${editing?.alias}` : 'Create short link'}
      description={isEdit ? 'Update governance rules. Historical analytics are preserved.' : 'Two quick steps: destination, then rules.'}
      footer={
        <>
          {step === 2 ? (
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft /> Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          )}
          {step === 1 ? (
            <Button size="lg" className="px-4" disabled={!urlOk || !aliasOk || aliasState === 'checking'} onClick={goNext}>
              Continue to rules <ArrowRight />
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-brand px-4 text-brand-foreground hover:bg-brand/90"
              disabled={!urlOk || !passwordValid || !targetingValid || !maxClicksValid || saving}
              onClick={submit}
            >
              <Check /> {isEdit ? 'Save rules' : 'Create link'}
            </Button>
          )}
        </>
      }
    >
      <StepIndicator step={step} />

      {step === 1 ? (
        <div className="flex flex-col gap-5">
          <Field label="Destination URL" htmlFor="dest" hint={<UrlStatus value={destination} />}>
            <Input
              id="dest"
              autoFocus
              placeholder="https://example.com/your/long/landing-page"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              aria-invalid={urlCheck.state === 'invalid' || urlCheck.state === 'unsafe'}
              className="font-mono text-[13px]"
            />
          </Field>
          <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            <span>Try:</span>
            {['https://shop.example.com/new-arrivals', 'http://free-giftz-claim.xyz/win', 'not a url'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDestination(s)}
                className="rounded border bg-muted/60 px-1.5 py-0.5 font-mono hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>

          <Field
            label="Custom alias"
            htmlFor="alias"
            hint={
              aliasState === 'available' ? (
                <span className="inline-flex items-center gap-1 text-success">
                  <CheckCircle2 className="size-3.5" /> {`${SHORT_DOMAIN}/${alias} is available`}
                </span>
              ) : aliasState === 'taken' ? (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <XCircle className="size-3.5" /> Alias already in use — try another
                </span>
              ) : aliasState === 'reserved' ? (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <XCircle className="size-3.5" /> Reserved system path
                </span>
              ) : alias ? (
                'Check availability before continuing.'
              ) : (
                'Leave empty to auto-generate a 7-character alias.'
              )
            }
          >
            <div className="flex gap-2">
              <div className="flex flex-1 items-center overflow-hidden rounded-lg border focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
                <span className="border-r bg-muted px-3 py-2 font-mono text-[13px] text-muted-foreground">{SHORT_DOMAIN}/</span>
                <input
                  id="alias"
                  value={alias}
                  onChange={(e) => onAliasChange(e.target.value)}
                  placeholder="diwali-offer"
                  className="h-9 min-w-0 flex-1 bg-background px-2 font-mono text-[13px] outline-none"
                />
                <button
                  type="button"
                  title="Random alias"
                  onClick={() => {
                    setAlias(randomAlias())
                    setAliasState('idle')
                  }}
                  className="px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Shuffle className="size-4" />
                  <span className="sr-only">Generate random alias</span>
                </button>
              </div>
              <Button variant="outline" size="lg" onClick={checkAvailability} disabled={!alias || aliasState === 'checking'}>
                {aliasState === 'checking' ? <Loader2 className="animate-spin" /> : null}
                Check availability
              </Button>
            </div>
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Campaign" htmlFor="campaign">
              <Select id="campaign" value={campaign} onChange={(e) => setCampaign(e.target.value)}>
                {campaigns.map((c) => (
                  <option key={c.name}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tags" htmlFor="tags" hint="Press Enter to add, up to 6.">
              <div className="flex min-h-9 flex-wrap items-center gap-1 rounded-lg border px-2 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs">
                    {t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="text-muted-foreground hover:text-foreground">
                      <X className="size-3" />
                      <span className="sr-only">Remove {t}</span>
                    </button>
                  </span>
                ))}
                <input
                  id="tags"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={onTagKey}
                  onBlur={addTag}
                  placeholder={tags.length ? '' : 'sale, festive'}
                  className="h-6 min-w-16 flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </Field>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_220px]">
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Expiry date" htmlFor="expiry" hint="Link stops redirecting after this day.">
                <Input id="expiry" type="date" min={new Date().toISOString().slice(0, 10)} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </Field>
              <Field
                label="Max click limit"
                htmlFor="max"
                hint={maxClicksValid ? 'Leave empty for unlimited.' : <span className="text-destructive">Enter a positive whole number.</span>}
              >
                <Input
                  id="max"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder="e.g. 5000"
                  value={maxClicks}
                  onChange={(e) => setMaxClicks(e.target.value)}
                />
              </Field>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Lock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Password protection</p>
                    <p className="text-xs text-muted-foreground">Visitors enter a password before redirecting.</p>
                  </div>
                </div>
                <Switch label="Password protection" checked={passwordOn} onCheckedChange={setPasswordOn} />
              </div>
              {passwordOn && (
                <div className="mt-3">
                  <Input
                    type="text"
                    aria-label="Link password"
                    placeholder="Minimum 4 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Device targeting</p>
                    <p className="text-xs text-muted-foreground">Send mobile and desktop visitors to different URLs.</p>
                  </div>
                </div>
                <Switch label="Device targeting" checked={targetingOn} onCheckedChange={setTargetingOn} />
              </div>
              {targetingOn && (
                <div className="mt-3 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-4 shrink-0 text-muted-foreground" />
                    <Input
                      aria-label="Mobile destination URL"
                      placeholder="https://m.example.com/…"
                      value={mobileUrl}
                      onChange={(e) => setMobileUrl(e.target.value)}
                      className="font-mono text-[13px]"
                    />
                  </div>
                  {mobileUrl && <UrlStatus value={mobileUrl} />}
                  <div className="flex items-center gap-2">
                    <Monitor className="size-4 shrink-0 text-muted-foreground" />
                    <Input
                      aria-label="Desktop destination URL"
                      placeholder="https://example.com/desktop"
                      value={desktopUrl}
                      onChange={(e) => setDesktopUrl(e.target.value)}
                      className="font-mono text-[13px]"
                    />
                  </div>
                  {desktopUrl && <UrlStatus value={desktopUrl} />}
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col items-center gap-3 rounded-xl border bg-muted/40 p-4 text-center">
            <p className="self-start text-xs font-medium text-muted-foreground">QR code preview</p>
            <div className="rounded-xl bg-white p-3 ring-1 ring-border">
              <QRCodeSVG value={shortUrl} size={150} level="M" marginSize={0} />
            </div>
            <p className="break-all font-mono text-xs">{origin ? workingShortUrl(origin, finalAlias) : brandedShort(finalAlias)}</p>
            <div className="flex flex-wrap justify-center gap-1">
              {expiresAt && <Badge>Expires {expiresAt}</Badge>}
              {maxClicks && maxClicksValid && <Badge>Cap {maxClicks}</Badge>}
              {passwordOn && <Badge tone="brand">Password</Badge>}
              {targetingOn && <Badge tone="brand">Device rules</Badge>}
              {!expiresAt && !maxClicks && !passwordOn && !targetingOn && <Badge>No restrictions</Badge>}
            </div>
            <p className="mt-auto truncate text-[11px] text-muted-foreground" title={destination}>
              {'→ '}
              {destination}
            </p>
          </aside>
        </div>
      )}
    </Modal>
  )
}
