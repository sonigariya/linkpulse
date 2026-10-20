import { getLinkStatus, type ShortLink } from '@/lib/linkpulse/data'
import { readDb, updateDb } from '@/lib/db'
import { clientIp, isBotUserAgent, locationFromIp, normalizeReferrer, parseBrowser, parseDevice, visitorKey } from '@/lib/linkpulse/ua'
import fs from 'fs'
import path from 'path'
export type RedirectResult =
  | { type: 'not-found' }
  | { type: 'disabled'; link: ShortLink }
  | { type: 'expired'; link: ShortLink }
  | { type: 'capped'; link: ShortLink }
  | { type: 'password'; link: ShortLink }
  | { type: 'wrong-password'; link: ShortLink }
  | { type: 'redirect'; url: string; link: ShortLink }

export function destinationFor(link: ShortLink, ua: string) {
  const device = parseDevice(ua)
  if (device === 'Mobile' && link.mobileUrl) return link.mobileUrl
  if (device === 'Desktop' && link.desktopUrl) return link.desktopUrl
  if (device === 'Tablet' && link.mobileUrl) return link.mobileUrl
  return link.destination
}

export async function resolveRedirect(alias: string, headersList: Headers, password?: string | null): Promise<RedirectResult> {
  const db = await readDb()
  const link = db.links.find((l) => l.alias.toLowerCase() === alias.toLowerCase())
  if (!link) return { type: 'not-found' }

  const status = getLinkStatus(link)
  if (status === 'disabled') return { type: 'disabled', link }
  if (status === 'expired') return { type: 'expired', link }
  if (status === 'capped') return { type: 'capped', link }

  if (link.password) {
    if (!password) return { type: 'password', link }
    if (password !== link.password) return { type: 'wrong-password', link }
  }

  const ua = headersList.get('user-agent') ?? ''
  const bot = isBotUserAgent(ua)
  const ip = clientIp(headersList)
  const recorded = await recordClick(link.alias, headersList, { bot, ip, ua })
  const latest = recorded.links.find((l) => l.id === link.id) ?? link
  return { type: 'redirect', url: destinationFor(latest, ua), link: latest }
}

export async function recordClick(alias: string, headersList: Headers, parsed?: { bot: boolean; ip: string; ua: string }) {
  const ua = parsed?.ua ?? headersList.get('user-agent') ?? ''
  const ip = parsed?.ip ?? clientIp(headersList)
  const bot = parsed?.bot ?? isBotUserAgent(ua)
  const referrer = normalizeReferrer(headersList.get('referer'))

  return updateDb((db) => {
    const link = db.links.find((l) => l.alias.toLowerCase() === alias.toLowerCase())
    if (!link) return
    if (!bot) link.clicks += 1
    if (!db.events) db.events = []
    db.events.unshift({
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      alias: link.alias,
      location: locationFromIp(ip),
      device: parseDevice(ua),
      browser: parseBrowser(ua),
      referrer: bot ? '-' : referrer,
      bot,
      visitorKey: visitorKey(ip, ua),
    })
    db.events = db.events.slice(0, 5000)
  })
}