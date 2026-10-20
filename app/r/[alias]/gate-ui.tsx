'use client'

import { useActionState, useState } from 'react'
import { Activity, ArrowLeft, ArrowRight, Clock, Eye, EyeOff, Loader2, Lock, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SHORT_DOMAIN } from '@/lib/linkpulse/data'
import { unlockLink } from './actions'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_0%,var(--muted),transparent_60%)] px-6 py-12">
      <div className="flex w-full max-w-md flex-col items-center">{children}</div>
      <div className="mt-10 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Activity className="size-3" /> Secured by LinkPulse
      </div>
    </div>
  )
}

export function PasswordForm({ alias }: { alias: string }) {
  const [show, setShow] = useState(false)
  const [state, action, pending] = useActionState(async (_prev: { error?: string } | null, formData: FormData) => {
    return unlockLink(alias, formData)
  }, null)

  return (
    <Shell>
      <form action={action} className="flex w-full flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-foreground text-background">
          <Lock className="size-5" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">This link is password protected</h1>
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
            name="password"
            type={show ? 'text' : 'password'}
            autoFocus
            required
            placeholder="Password"
            aria-invalid={Boolean(state?.error)}
            className={cn(
              'h-11 w-full rounded-lg border bg-background px-3 pr-10 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
              state?.error && 'border-destructive focus-visible:ring-destructive/25',
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
        {state?.error && <p className="mt-2 self-start text-xs text-destructive">{state.error}</p>}
        <Button type="submit" size="lg" className="mt-4 h-11 w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          Continue <ArrowRight />
        </Button>
      </form>
    </Shell>
  )
}

export function ExpiredGate({ alias, capped }: { alias: string; capped: boolean }) {
  return (
    <Shell>
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted ring-1 ring-border">
          <Clock className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">{capped ? 'Click limit reached' : 'This link has expired'}</h1>
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
        <a
          href="/"
          className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft className="size-4" /> Go back
        </a>
      </div>
    </Shell>
  )
}

export function DisabledGate({ alias, reason }: { alias: string; reason: string }) {
  return (
    <Shell>
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
          <ShieldAlert className="size-6 text-destructive" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Link disabled for your safety</h1>
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
        <a
          href="/"
          className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
        >
          <ArrowLeft className="size-4" /> Take me back to safety
        </a>
      </div>
    </Shell>
  )
}

export function MissingGate({ alias }: { alias: string }) {
  return (
    <Shell>
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted ring-1 ring-border">
          <ShieldAlert className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-lg font-semibold">Link not found</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          <span className="font-mono text-foreground">
            {SHORT_DOMAIN}/{alias}
          </span>{' '}
          does not exist or has been removed.
        </p>
        <a
          href="/"
          className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
        >
          <ArrowLeft className="size-4" /> Back to LinkPulse
        </a>
      </div>
    </Shell>
  )
}
