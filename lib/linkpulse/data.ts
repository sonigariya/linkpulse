export const SHORT_DOMAIN = 'lnkp.ls'

export type LinkStatus = 'active' | 'expired' | 'capped' | 'disabled'

export type ShortLink = {
  id: string
  alias: string
  destination: string
  campaign: string
  tags: string[]
  clicks: number
  createdAt: string
  expiresAt: string | null
  maxClicks: number | null
  password: string | null
  mobileUrl: string | null
  desktopUrl: string | null
  disabledByAdmin: boolean
  disabledReason?: string
}

export type SuspiciousReport = {
  linkId: string
  riskScore: number
  reasons: string[]
  reportedAt: string
  reporter: string
}

export type Campaign = {
  name: string
  goal: number
  color: string
}

export const CAMPAIGNS: Campaign[] = [
  { name: 'Diwali Sale 2026', goal: 60000, color: 'var(--chart-4)' },
  { name: 'Product Launch', goal: 40000, color: 'var(--chart-1)' },
  { name: 'Campus Drive', goal: 15000, color: 'var(--chart-3)' },
  { name: 'Newsletter', goal: 10000, color: 'var(--chart-2)' },
]

export const INITIAL_LINKS: ShortLink[] = [
  {
    id: 'l1',
    alias: 'diwali-mega',
    destination: 'https://shop.example.com/sale/diwali-2026?utm_source=linkpulse',
    campaign: 'Diwali Sale 2026',
    tags: ['sale', 'festive'],
    clicks: 24318,
    createdAt: '2026-10-01',
    expiresAt: '2026-11-15',
    maxClicks: null,
    password: null,
    mobileUrl: 'https://m.shop.example.com/sale/diwali-2026',
    desktopUrl: null,
    disabledByAdmin: false,
  },
  {
    id: 'l2',
    alias: 'launch-v3',
    destination: 'https://product.example.com/launch/v3',
    campaign: 'Product Launch',
    tags: ['launch', 'press'],
    clicks: 18742,
    createdAt: '2026-09-22',
    expiresAt: null,
    maxClicks: null,
    password: null,
    mobileUrl: null,
    desktopUrl: null,
    disabledByAdmin: false,
  },
  {
    id: 'l3',
    alias: 'campus-apply',
    destination: 'https://careers.example.com/campus/apply',
    campaign: 'Campus Drive',
    tags: ['hiring'],
    clicks: 6120,
    createdAt: '2026-09-10',
    expiresAt: null,
    maxClicks: 8000,
    password: 'campus26',
    mobileUrl: null,
    desktopUrl: null,
    disabledByAdmin: false,
  },
  {
    id: 'l4',
    alias: 'early-bird',
    destination: 'https://shop.example.com/early-bird',
    campaign: 'Diwali Sale 2026',
    tags: ['sale', 'limited'],
    clicks: 5000,
    createdAt: '2026-09-28',
    expiresAt: null,
    maxClicks: 5000,
    password: null,
    mobileUrl: null,
    desktopUrl: null,
    disabledByAdmin: false,
  },
  {
    id: 'l5',
    alias: 'summer-recap',
    destination: 'https://blog.example.com/2026/summer-recap',
    campaign: 'Newsletter',
    tags: ['blog'],
    clicks: 3311,
    createdAt: '2026-07-02',
    expiresAt: '2026-09-30',
    maxClicks: null,
    password: null,
    mobileUrl: null,
    desktopUrl: null,
    disabledByAdmin: false,
  },
  {
    id: 'l6',
    alias: 'free-iphone',
    destination: 'http://free-giftz-claim.xyz/win?ref=lp',
    campaign: 'Newsletter',
    tags: ['promo'],
    clicks: 1904,
    createdAt: '2026-10-14',
    expiresAt: null,
    maxClicks: null,
    password: null,
    mobileUrl: null,
    desktopUrl: null,
    disabledByAdmin: false,
  },
  {
    id: 'l7',
    alias: 'app-download',
    destination: 'https://product.example.com/download',
    campaign: 'Product Launch',
    tags: ['app', 'launch'],
    clicks: 9876,
    createdAt: '2026-09-25',
    expiresAt: null,
    maxClicks: null,
    password: null,
    mobileUrl: 'https://apps.apple.com/app/example/id000000',
    desktopUrl: 'https://product.example.com/download/desktop',
    disabledByAdmin: false,
  },
  {
    id: 'l8',
    alias: 'wallet-verify',
    destination: 'https://secure-wallet-verify.top/login',
    campaign: 'Campus Drive',
    tags: ['misc'],
    clicks: 742,
    createdAt: '2026-10-12',
    expiresAt: null,
    maxClicks: null,
    password: null,
    mobileUrl: null,
    desktopUrl: null,
    disabledByAdmin: true,
    disabledReason: 'Phishing — credential harvesting page',
  },
  {
    id: 'l9',
    alias: 'webinar-oct',
    destination: 'https://events.example.com/webinar/october',
    campaign: 'Product Launch',
    tags: ['event'],
    clicks: 1288,
    createdAt: '2026-10-03',
    expiresAt: '2026-10-28',
    maxClicks: 2000,
    password: null,
    mobileUrl: null,
    desktopUrl: null,
    disabledByAdmin: false,
  },
  {
    id: 'l10',
    alias: 'crypto-airdrop',
    destination: 'http://192.168.44.12/airdrop/claim',
    campaign: 'Newsletter',
    tags: ['promo'],
    clicks: 413,
    createdAt: '2026-10-16',
    expiresAt: null,
    maxClicks: null,
    password: null,
    mobileUrl: null,
    desktopUrl: null,
    disabledByAdmin: false,
  },
]

export const INITIAL_REPORTS: SuspiciousReport[] = [
  {
    linkId: 'l6',
    riskScore: 92,
    reasons: ['Gift-scam keyword pattern', 'Newly registered .xyz domain', 'Click spike from 3 ASNs'],
    reportedAt: '12 min ago',
    reporter: 'Auto-scanner',
  },
  {
    linkId: 'l10',
    riskScore: 87,
    reasons: ['Raw IP destination', 'Crypto airdrop lure', 'No TLS'],
    reportedAt: '38 min ago',
    reporter: 'Auto-scanner',
  },
  {
    linkId: 'l9',
    riskScore: 34,
    reasons: ['User report: "redirect loop"'],
    reportedAt: '2 h ago',
    reporter: 'priya@acme.in',
  },
  {
    linkId: 'l8',
    riskScore: 98,
    reasons: ['Matched PhishTank feed', 'Brand impersonation'],
    reportedAt: 'Yesterday',
    reporter: 'Google Safe Browsing',
  },
]

export const INITIAL_BLOCKLIST = [
  'free-giftz-claim.xyz',
  'secure-wallet-verify.top',
  'bit-prize.click',
  'paypa1-support.com',
  'login-microsoftt.net',
]

export const RESERVED_ALIASES = ['admin', 'api', 'login', 'app', 'dashboard', 'settings', 'help']

export function getLinkStatus(link: ShortLink, now = new Date()): LinkStatus {
  if (link.disabledByAdmin) return 'disabled'
  if (link.expiresAt && new Date(`${link.expiresAt}T23:59:59`) < now) return 'expired'
  if (link.maxClicks !== null && link.clicks >= link.maxClicks) return 'capped'
  return 'active'
}

export function localRedirectPath(alias: string) {
  return `/r/${alias}`
}

export function brandedShort(alias: string) {
  return `${SHORT_DOMAIN}/${alias}`
}

export function workingShortUrl(origin: string, alias: string) {
  return `${origin}${localRedirectPath(alias)}`
}

export type UrlCheck =
  | { state: 'empty' }
  | { state: 'invalid'; message: string }
  | { state: 'unsafe'; message: string }
  | { state: 'warning'; message: string }
  | { state: 'valid'; hostname: string }

const SUSPICIOUS_PATTERNS = [/free-?gift/i, /airdrop/i, /verify-?wallet|wallet-?verify/i, /claim-?prize/i]

export function checkUrl(raw: string, blocklist: string[]): UrlCheck {
  const value = raw.trim()
  if (!value) return { state: 'empty' }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { state: 'invalid', message: 'Invalid URL format — include https://' }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { state: 'invalid', message: 'Only http(s) URLs are allowed' }
  }
  if (!url.hostname.includes('.')) {
    return { state: 'invalid', message: 'Invalid URL format — missing domain' }
  }
  const host = url.hostname.toLowerCase()
  if (blocklist.some((d) => host === d || host.endsWith(`.${d}`))) {
    return { state: 'unsafe', message: `Unsafe domain blocked: ${host}` }
  }
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return { state: 'unsafe', message: 'Raw IP destinations are not allowed' }
  }
  if (SUSPICIOUS_PATTERNS.some((p) => p.test(value))) {
    return { state: 'unsafe', message: 'Matches known phishing / scam pattern' }
  }
  if (url.protocol === 'http:') {
    return { state: 'warning', message: 'Not encrypted — consider https://' }
  }
  return { state: 'valid', hostname: host }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat('en-US').format(n)
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}
