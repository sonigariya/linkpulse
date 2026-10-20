'use client'

import { useState } from 'react'
import {
  Activity,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  Link2,
  Lock,
  Menu,
  ShieldAlert,
  ShieldCheck,
  Upload,
  User,
  Eye,
  X,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLinkPulse, type Role, type Tab } from './store'
import { Segmented } from './primitives'
import { LinksView } from './links/links-view'
import { AnalyticsView } from './analytics/analytics-view'
import { CampaignsView } from './campaigns-view'
import { BulkImportView } from './bulk-import-view'
import { AdminView } from './admin/admin-view'
import { VisitorGateView } from './visitor-gate-view'

const NAV: { id: Tab; label: string; icon: typeof Link2 }[] = [
  { id: 'links', label: 'Links', icon: Link2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'campaigns', label: 'Campaigns & Folders', icon: FolderKanban },
  { id: 'import', label: 'Bulk CSV Import', icon: Upload },
  { id: 'admin', label: 'Admin Governance', icon: ShieldAlert },
]

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
        <Activity className="size-4" strokeWidth={2.5} />
      </div>
      <span className="text-sm font-semibold tracking-tight">LinkPulse</span>
    </div>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { tab, setTab, role, reports, setRole } = useLinkPulse()
  const isAdmin = role === 'admin'
  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-1 p-3">
      <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
      {NAV.map((item) => {
        const active = tab === item.id
        const isAdminItem = item.id === 'admin'
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              setTab(item.id)
              onNavigate?.()
            }}
            className={cn(
              'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
              active ? 'bg-background font-medium text-foreground shadow-xs ring-1 ring-border' : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
              isAdminItem && isAdmin && !active && 'bg-destructive/5 text-destructive ring-1 ring-destructive/20',
              isAdminItem && isAdmin && active && 'ring-destructive/40 text-destructive',
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {isAdminItem && !isAdmin && <Lock className="size-3.5 text-muted-foreground/70" aria-label="Admin only" />}
            {isAdminItem && isAdmin && reports.length > 0 && (
              <span className="rounded-full bg-destructive px-1.5 text-[10px] font-semibold leading-4 text-white">
                {reports.length}
              </span>
            )}
          </button>
        )
      })}

      <p className="px-2 pb-1 pt-5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Preview</p>
      <button
        type="button"
        onClick={() => {
          setRole('visitor')
          onNavigate?.()
        }}
        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
      >
        <Eye className="size-4" />
        Visitor Redirect Gate
      </button>

      <div className="mt-auto rounded-xl border bg-background p-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <CheckCircle2 className="size-3.5 text-success" />
          All systems operational
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Edge redirects p50 <span className="font-mono text-foreground">11ms</span> across 18 regions.
        </p>
      </div>
    </nav>
  )
}

function RoleSwitcher() {
  const { role, setRole } = useLinkPulse()
  return (
    <Segmented<Role>
      label="Role"
      value={role}
      onChange={setRole}
      options={[
        { value: 'user', label: <><User className="size-3.5" /><span className="hidden sm:inline">User</span></> },
        { value: 'admin', label: <><ShieldCheck className="size-3.5" /><span className="hidden sm:inline">Admin</span></> },
        { value: 'visitor', label: <><Eye className="size-3.5" /><span className="hidden sm:inline">Visitor Gate</span></> },
      ]}
    />
  )
}

function Toaster() {
  const { toasts, dismissToast } = useLinkPulse()
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border bg-background p-3.5 shadow-lg animate-in slide-in-from-bottom-2 fade-in-0',
            t.tone === 'danger' && 'border-destructive/30',
          )}
        >
          {t.tone === 'danger' ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          ) : (
            <CheckCircle2 className={cn('mt-0.5 size-4 shrink-0', t.tone === 'success' ? 'text-success' : 'text-brand')} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t.title}</p>
            {t.description && <p className="mt-0.5 break-words text-xs text-muted-foreground">{t.description}</p>}
          </div>
          <button type="button" onClick={() => dismissToast(t.id)} className="text-muted-foreground hover:text-foreground">
            <X className="size-3.5" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      ))}
    </div>
  )
}

function AdminLocked() {
  const { setRole } = useLinkPulse()
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed bg-muted/30 px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-full bg-background ring-1 ring-border">
        <Lock className="size-5 text-muted-foreground" />
      </div>
      <h2 className="mt-4 text-base font-semibold">Admin access required</h2>
      <p className="mt-1 text-sm text-muted-foreground text-pretty">
        Governance tools, abuse queue and domain blocklist are only available to workspace admins.
      </p>
      <button
        type="button"
        onClick={() => setRole('admin')}
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
      >
        <ShieldCheck className="size-4" />
        Switch to Admin View
      </button>
    </div>
  )
}

export function AppShell() {
  const { tab, role, ready } = useLinkPulse()
  
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Loading workspace…
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
    
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
        {role !== 'visitor' && (
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
            <span className="sr-only">Open navigation</span>
          </button>
        )}
        <Logo />
        <span className="hidden text-muted-foreground/50 sm:inline">/</span>
        <span className="hidden text-sm text-muted-foreground sm:inline">acme-marketing</span>
        {role === 'admin' && (
          <span className="hidden items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive md:inline-flex">
            <ShieldAlert className="size-3" /> Admin mode
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <RoleSwitcher />
          <div
            className="hidden size-8 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[var(--chart-2)] text-xs font-semibold text-white sm:flex"
            aria-label="Signed in as Aarav Mehta"
          >
            AM
          </div>
        </div>
      </header>

      {role === 'visitor' ? (
        <VisitorGateView />
      ) : (
        <div className="flex flex-1">
          <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 border-r bg-muted/40 lg:block">
            <Sidebar />
          </aside>

          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label="Close navigation"
                className="absolute inset-0 bg-foreground/30"
                onClick={() => setMobileOpen(false)}
              />
              <aside className="absolute inset-y-0 left-0 w-64 border-r bg-muted animate-in slide-in-from-left">
                <div className="flex h-14 items-center justify-between border-b px-4">
                  <Logo />
                  <button type="button" onClick={() => setMobileOpen(false)} className="rounded-md p-1 hover:bg-background">
                    <X className="size-4" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>
                <div className="h-[calc(100%-3.5rem)]">
                  <Sidebar onNavigate={() => setMobileOpen(false)} />
                </div>
              </aside>
            </div>
          )}

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-7xl">
            {tab === 'links' && <LinksView />}
              {tab === 'analytics' && <AnalyticsView />}
              {tab === 'campaigns' && <CampaignsView />}
              {tab === 'import' && <BulkImportView />}
              {tab === 'admin' && (role === 'admin' ? <AdminView /> : <AdminLocked />)}
            </div>
          </main>
        </div>
      )}
      <Toaster />
    </div>
  )
}
