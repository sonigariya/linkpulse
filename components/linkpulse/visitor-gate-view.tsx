'use client'

import { useState, type FormEvent } from 'react'
import { Activity, ArrowLeft, ArrowRight, Clock, Eye, EyeOff, Loader2, Lock, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SHORT_DOMAIN } from '@/lib/linkpulse/data'
import { useLinkPulse } from './store'
import { Segmented } from './primitives'

type Screen = 'password' | 'expired' | 'disabled'

function BrowserFrame({ alias, children }: { alias: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-2xl border bg-background shadow-xl">
      <div className="flex items-center gap-3 border-b bg-muted/60 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[oklch(0.7_0.17_25)]" />
          <span className="size-2.5 rounded-full bg-[oklch(0.82_0.15_85)]" />
          <span className="size-2.5 rounded-full bg-[oklch(0.72_0.16_150)]" />
        </div>
        <div className="flex flex-1 items-center gap-1.5 truncate rounded-md border bg-background px-3 py-1 font-mono text-xs text-muted-foreground">
          <Lock className="size-3" />
          https://{SHORT_DOMAIN}/{alias}
        </div>
      </div>
      <div className="flex min-h-[440px] flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_0%,var(--muted),transparent_60%)] px-6 py-12">
        {children}
      </div>
      <div className="flex items-center justify-center gap-1.5 border-t py-2.5 text-[11px] text-muted-foreground">
        <Activity className="size-3" /> Secured by LinkPulse
      </div>
    </div>
  )
}

function PasswordScreen({ alias, correct, destination }: { alias: string; correct: string; destination: string }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [state, setState] = useState<'idle' | 'checking' | 'error' | 'success'>('idle')

  function submit(e: FormEvent) {
    e.preventDefault()
    setState('checking')
    setTimeout(() => setState(value === correct ? 'success' : 'error'), 600)
  }

  if (state === 'success') {
    return (
      <div className="flex max-w-sm flex-col items-center text-center animate-in fade-in-0 zoom-in-95">
        <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
          <ShieldCheck className="size-6 text-success" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Access granted</h2>
        <p className="mt-1 text-sm text-muted-foreground">Redirecting you to</p>
        <p className="mt-1 max-w-full truncate font-mono text-xs">{destination}</p>
        <Loader2 className="mt-5 size-5 animate-spin text-muted-foreground" />
        <button type="button" onClick={() => { setState('idle'); setValue('') }} className="mt-6 text-xs text-muted-foreground underline-offset-4 hover:underline">
          Reset preview
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col items-center text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
        <Lock className="size-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">This link is password protected</h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        Enter the password shared with you to continue to{' '}
        <span className="font-mono text-foreground">
          {SHORT_DOMAIN}/{alias}
        </span>
        .
      </p>
      <div className="relative mt-6 w-full">
        <label htmlFor="gate-pw" className="sr-only">
          Password
        </label>
        <input
          id="gate-pw"
          type={show ? 'text' : 'password'}
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (state === 'error') setState('idle')
          }}
          placeholder="Password"
          aria-invalid={state === 'error'}
          className={cn(
            'h-11 w-full rounded-lg border bg-background px-3 pr-10 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
            state === 'error' && 'border-destructive focus-visible:ring-destructive/25',
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          <span className="sr-only">{show ? 'Hide password' : 'Show password'}</span>
        </button>
      </div>
      {state === 'error' && <p className="mt-2 self-start text-xs text-destructive">Incorrect password. Please try again.</p>}
      <Button type="submit" size="lg" className="mt-4 h-11 w-full" disabled={!value || state === 'checking'}>
        {state === 'checking' ? <Loader2 className="animate-spin" /> : null}
        Continue <ArrowRight />
      </Button>
      <p className="mt-4 text-[11px] text-muted-foreground">
        Demo password: <span className="font-mono text-foreground">{correct}</span>
      </p>
    </form>
  )
}

function ExpiredScreen({ alias, capped }: { alias: string; capped: boolean }) {
  return (
    <div className="flex max-w-sm flex-col items-center text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted ring-1 ring-border">
        <Clock className="size-5 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{capped ? 'Click limit reached' : 'This link has expired'}</h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        <span className="font-mono text-foreground">
          {SHORT_DOMAIN}/{alias}
        </span>{' '}
        {capped
          ? 'has reached the maximum number of visits set by its owner.'
          : 'is no longer active. The owner set an expiry date that has passed.'}
      </p>
      <div className="mt-6 w-full rounded-xl border bg-muted/40 p-4 text-left text-xs text-muted-foreground">
        If you believe this is a mistake, contact the person who shared this link and ask for an updated URL.
      </div>
      <Button variant="outline" size="lg" className="mt-5">
        <ArrowLeft /> Go back
      </Button>
    </div>
  )
}

function DisabledScreen({ alias, reason }: { alias: string; reason: string }) {
  return (
    <div className="flex max-w-md flex-col items-center text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
        <ShieldAlert className="size-6 text-destructive" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">Link disabled for your safety</h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        Our trust & safety team disabled{' '}
        <span className="font-mono text-foreground">
          {SHORT_DOMAIN}/{alias}
        </span>{' '}
        because it may lead to a harmful or deceptive website.
      </p>
      <div className="mt-6 w-full rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-left">
        <p className="text-xs font-medium text-destructive">Reason flagged</p>
        <p className="mt-0.5 text-sm">{reason}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Never enter passwords, OTPs, or payment details on pages reached through suspicious links.
        </p>
      </div>
      <Button size="lg" className="mt-5">
        <ArrowLeft /> Take me back to safety
      </Button>
    </div>
  )
}

export function VisitorGateView() {
  const { links, setRole } = useLinkPulse()
  const [screen, setScreen] = useState<Screen>('password')

  const pwLink = links.find((l) => l.password && !l.disabledByAdmin)
  const expiredLink = links.find((l) => l.expiresAt && l.expiresAt < '2026-10-18') ?? links.find((l) => l.maxClicks && l.clicks >= l.maxClicks)
  const disabledLink = links.find((l) => l.disabledByAdmin)
  const expiredIsCap = Boolean(expiredLink && !(expiredLink.expiresAt && expiredLink.expiresAt < '2026-10-18'))

  return (
    <main className="flex flex-1 flex-col items-center gap-6 bg-muted/40 px-4 py-8 sm:py-12">
      <div className="flex w-full max-w-3xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Visitor Redirect Gate Preview</h1>
          <p className="text-sm text-muted-foreground">What anonymous visitors see on protected or blocked links.</p>
        </div>
        <Button variant="ghost" onClick={() => setRole('user')}>
          <ArrowLeft /> Back to dashboard
        </Button>
      </div>
      <Segmented<Screen>
        label="Gate screen"
        value={screen}
        onChange={setScreen}
        className="max-w-full overflow-x-auto"
        options={[
          { value: 'password', label: <><Lock className="size-3.5" />Password entry</> },
          { value: 'expired', label: <><Clock className="size-3.5" />Expired / Cap reached</> },
          { value: 'disabled', label: <><ShieldAlert className="size-3.5" />Disabled for safety</> },
        ]}
      />
      {screen === 'password' && (
        <BrowserFrame alias={pwLink?.alias ?? 'private-deck'}>
          <PasswordScreen
            alias={pwLink?.alias ?? 'private-deck'}
            correct={pwLink?.password ?? 'pulse2026'}
            destination={pwLink?.destination ?? 'https://example.com'}
          />
        </BrowserFrame>
      )}
      {screen === 'expired' && (
        <BrowserFrame alias={expiredLink?.alias ?? 'summer-sale'}>
          <ExpiredScreen alias={expiredLink?.alias ?? 'summer-sale'} capped={expiredIsCap} />
        </BrowserFrame>
      )}
      {screen === 'disabled' && (
        <BrowserFrame alias={disabledLink?.alias ?? 'free-iphone'}>
          <DisabledScreen alias={disabledLink?.alias ?? 'free-iphone'} reason={disabledLink?.disabledReason ?? 'Matched phishing threat feed'} />
        </BrowserFrame>
      )}
    </main>
  )
}
