'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Campaign, ShortLink, SuspiciousReport } from '@/lib/linkpulse/data'

export type Role = 'user' | 'admin' | 'visitor'
export type Tab = 'links' | 'analytics' | 'campaigns' | 'import' | 'admin'

type Toast = { id: number; title: string; description?: string; tone: 'default' | 'success' | 'danger' }

type Store = {
  ready: boolean
  role: Role
  setRole: (r: Role) => void
  tab: Tab
  setTab: (t: Tab) => void
  links: ShortLink[]
  addLinks: (
    links: Array<Omit<ShortLink, 'id' | 'clicks' | 'createdAt'> & Partial<Pick<ShortLink, 'id' | 'clicks' | 'createdAt'>>>,
  ) => Promise<string | null>
  updateLink: (id: string, patch: Partial<ShortLink>) => Promise<boolean>
  campaigns: Campaign[]
  addCampaign: (c: Campaign) => Promise<boolean>
  blocklist: string[]
  addBlockedDomain: (d: string) => Promise<boolean>
  removeBlockedDomain: (d: string) => Promise<boolean>
  reports: SuspiciousReport[]
  resolveReport: (linkId: string) => Promise<boolean>
  takedownLink: (linkId: string, reason?: string) => Promise<boolean>
  importRows: (rows: { url: string; alias: string; campaign: string; tags: string[] }[]) => Promise<boolean>
  refresh: () => Promise<void>
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id' | 'tone'> & { tone?: Toast['tone'] }) => void
  dismissToast: (id: number) => void
}

const StoreContext = createContext<Store | null>(null)

async function parseJson(res: Response) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed')
  return data
}

export function LinkPulseProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [role, setRoleState] = useState<Role>('user')
  const [tab, setTab] = useState<Tab>('links')
  const [links, setLinks] = useState<ShortLink[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [blocklist, setBlocklist] = useState<string[]>([])
  const [reports, setReports] = useState<SuspiciousReport[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const dismissToast = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback<Store['toast']>(
    ({ tone = 'default', ...rest }) => {
      const id = ++toastId.current
      setToasts((ts) => [...ts.slice(-2), { id, tone, ...rest }])
      setTimeout(() => dismissToast(id), 3800)
    },
    [dismissToast],
  )

  const applyState = useCallback((data: Partial<{ links: ShortLink[]; campaigns: Campaign[]; blocklist: string[]; reports: SuspiciousReport[] }>) => {
    if (data.links) setLinks(data.links)
    if (data.campaigns) setCampaigns(data.campaigns)
    if (data.blocklist) setBlocklist(data.blocklist)
    if (data.reports) setReports(data.reports)
  }, [])

  const refresh = useCallback(async () => {
    const data = await parseJson(await fetch('/api/state', { cache: 'no-store' }))
    applyState(data)
  }, [applyState])

  useEffect(() => {
    refresh()
      .catch(() => toast({ title: 'Could not load workspace', tone: 'danger' }))
      .finally(() => setReady(true))
    const id = setInterval(() => {
      refresh().catch(() => undefined)
    }, 4000)
    return () => clearInterval(id)
  }, [refresh, toast])

  const setRole = useCallback((r: Role) => {
    setRoleState(r)
    if (r === 'admin') setTab('admin')
    if (r === 'user') setTab((t) => (t === 'admin' ? 'links' : t))
  }, [])

  const addLinks = useCallback<Store['addLinks']>(
    async (newLinks) => {
      try {
        const data = await parseJson(
          await fetch('/api/links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: newLinks }),
          }),
        )
        applyState(data)
        return (data as { created?: ShortLink[] }).created?.[0]?.id ?? null
      } catch (error) {
        toast({ title: 'Could not save link', description: error instanceof Error ? error.message : undefined, tone: 'danger' })
        return null
      }
    },
    [applyState, toast],
  )

  const updateLink = useCallback<Store['updateLink']>(
    async (id, patch) => {
      try {
        const data = await parseJson(
          await fetch(`/api/links/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
          }),
        )
        applyState(data)
        return true
      } catch (error) {
        toast({ title: 'Could not update link', description: error instanceof Error ? error.message : undefined, tone: 'danger' })
        return false
      }
    },
    [applyState, toast],
  )

  const addCampaign = useCallback<Store['addCampaign']>(
    async (c) => {
      try {
        const data = await parseJson(
          await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(c),
          }),
        )
        applyState(data)
        return true
      } catch (error) {
        toast({ title: 'Could not create campaign', description: error instanceof Error ? error.message : undefined, tone: 'danger' })
        return false
      }
    },
    [applyState, toast],
  )

  const adminAction = useCallback(
    async (body: Record<string, unknown>) => {
      const data = await parseJson(
        await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      )
      applyState(data)
      return true
    },
    [applyState],
  )

  const addBlockedDomain = useCallback<Store['addBlockedDomain']>(
    async (d) => {
      try {
        return await adminAction({ action: 'add-block', domain: d })
      } catch (error) {
        toast({ title: 'Could not block domain', description: error instanceof Error ? error.message : undefined, tone: 'danger' })
        return false
      }
    },
    [adminAction, toast],
  )

  const removeBlockedDomain = useCallback<Store['removeBlockedDomain']>(
    async (d) => {
      try {
        return await adminAction({ action: 'remove-block', domain: d })
      } catch {
        toast({ title: 'Could not unblock domain', tone: 'danger' })
        return false
      }
    },
    [adminAction, toast],
  )

  const resolveReport = useCallback<Store['resolveReport']>(
    async (linkId) => {
      try {
        return await adminAction({ action: 'resolve-report', linkId })
      } catch {
        toast({ title: 'Could not update report', tone: 'danger' })
        return false
      }
    },
    [adminAction, toast],
  )

  const takedownLink = useCallback<Store['takedownLink']>(
    async (linkId, reason) => {
      try {
        return await adminAction({ action: 'takedown', linkId, reason })
      } catch {
        toast({ title: 'Could not take down link', tone: 'danger' })
        return false
      }
    },
    [adminAction, toast],
  )

  const importRows = useCallback<Store['importRows']>(
    async (rows) => {
      try {
        const data = await parseJson(
          await fetch('/api/bulk-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows }),
          }),
        )
        applyState(data)
        return true
      } catch (error) {
        toast({ title: 'Import failed', description: error instanceof Error ? error.message : undefined, tone: 'danger' })
        return false
      }
    },
    [applyState, toast],
  )

  const value = useMemo<Store>(
    () => ({
      ready,
      role,
      setRole,
      tab,
      setTab,
      links,
      addLinks,
      updateLink,
      campaigns,
      addCampaign,
      blocklist,
      addBlockedDomain,
      removeBlockedDomain,
      reports,
      resolveReport,
      takedownLink,
      importRows,
      refresh,
      toasts,
      toast,
      dismissToast,
    }),
    [
      ready,
      role,
      setRole,
      tab,
      links,
      addLinks,
      updateLink,
      campaigns,
      addCampaign,
      blocklist,
      addBlockedDomain,
      removeBlockedDomain,
      reports,
      resolveReport,
      takedownLink,
      importRows,
      refresh,
      toasts,
      toast,
      dismissToast,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useLinkPulse() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useLinkPulse must be used inside LinkPulseProvider')
  return ctx
}
