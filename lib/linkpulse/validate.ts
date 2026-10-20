import { RESERVED_ALIASES, checkUrl, slugify, type ShortLink } from '@/lib/linkpulse/data'

export type LinkInput = {
  alias?: string
  destination: string
  campaign: string
  tags?: string[]
  expiresAt?: string | null
  maxClicks?: number | null
  password?: string | null
  mobileUrl?: string | null
  desktopUrl?: string | null
  disabledByAdmin?: boolean
  disabledReason?: string
}

export function randomAlias() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function uniqueAlias(preferred: string, used: Set<string>) {
  let alias = slugify(preferred)
  if (!alias) alias = randomAlias()
  while (used.has(alias) || RESERVED_ALIASES.includes(alias)) alias = randomAlias()
  used.add(alias)
  return alias
}

export function validateDestination(url: string, blocklist: string[]) {
  const check = checkUrl(url, blocklist)
  if (check.state === 'invalid' || check.state === 'empty' || check.state === 'unsafe') {
    return { ok: false as const, message: check.state === 'empty' ? 'Destination URL is required' : check.message }
  }
  return { ok: true as const }
}

export function toShortLink(input: LinkInput, used: Set<string>): ShortLink {
  return {
    id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    alias: uniqueAlias(input.alias ?? '', used),
    destination: input.destination.trim(),
    campaign: input.campaign || 'Newsletter',
    tags: (input.tags ?? []).map(slugify).filter(Boolean).slice(0, 6),
    clicks: 0,
    createdAt: new Date().toISOString().slice(0, 10),
    expiresAt: input.expiresAt || null,
    maxClicks: input.maxClicks ?? null,
    password: input.password || null,
    mobileUrl: input.mobileUrl || null,
    desktopUrl: input.desktopUrl || null,
    disabledByAdmin: Boolean(input.disabledByAdmin),
    disabledReason: input.disabledReason,
  }
}
