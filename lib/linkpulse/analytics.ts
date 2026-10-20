import type { ShortLink } from '@/lib/linkpulse/data'

export type Period = '24h' | '7d' | '30d'

export type ClickEvent = {
  id: string
  timestamp: string
  alias: string
  location: string
  device: 'Mobile' | 'Desktop' | 'Tablet'
  browser: string
  referrer: string
  bot: boolean
  visitorKey: string
}

function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const LOCS = ['Mumbai, IN', 'Bengaluru, IN', 'Pune, IN', 'Delhi, IN', 'London, GB', 'Austin, US', 'Singapore, SG', 'Dubai, AE']
const DEVICES: ClickEvent['device'][] = ['Mobile', 'Mobile', 'Mobile', 'Desktop', 'Desktop', 'Tablet']
const BROWSERS = ['Chrome', 'Safari', 'Chrome', 'Edge', 'Firefox', 'Samsung Internet']
const REFS = ['instagram.com', 'whatsapp', 'Direct / QR', 'x.com', 'linkedin.com', 'google.com']

export function generateSeedEvents(links: ShortLink[], now = Date.now()): ClickEvent[] {
  const rand = seeded(42)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const weighted = (links || []).flatMap((l) => Array.from({ length: Math.max(1, Math.round(l.clicks / 4000)) }, () => l.alias))
  const events: ClickEvent[] = []
  const days = 30
  for (let day = days - 1; day >= 0; day--) {
    const count = 18 + Math.floor(rand() * 16)
    for (let i = 0; i < count; i++) {
      const bot = rand() < 0.08
      const ts = new Date(now - day * 86400000 - Math.floor(rand() * 86400000))
      const alias = pick(weighted.length ? weighted : links.map((l) => l.alias))
      const uaHint = bot ? pick(['HeadlessChrome', 'python-requests', 'curl']) : pick(BROWSERS)
      events.push({
        id: `seed-${events.length}`,
        timestamp: ts.toISOString(),
        alias,
        location: bot ? pick(['Ashburn, US', 'Frankfurt, DE']) : pick(LOCS),
        device: bot ? 'Desktop' : pick(DEVICES),
        browser: uaHint,
        referrer: bot ? '—' : pick(REFS),
        bot,
        visitorKey: `seed-${Math.floor(rand() * 180)}`,
      })
    }
  }
  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

function periodMs(period: Period) {
  if (period === '24h') return 24 * 3600000
  if (period === '7d') return 7 * 86400000
  return 30 * 86400000
}

function deltaPct(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100
  return Math.round(((current - previous) / previous) * 1000) / 10
}

function countBy<T extends string>(items: { key: T; n?: number }[], keys: T[]) {
  const map = new Map<T, number>(keys.map((k) => [k, 0]))
  for (const item of items) map.set(item.key, (map.get(item.key) ?? 0) + (item.n ?? 1))
  return keys.map((k) => ({ name: k, value: map.get(k) ?? 0 }))
}

export function aggregateAnalytics(events: ClickEvent[], links: ShortLink[], period: Period, campaign: string) {
  const now = Date.now()
  const windowMs = periodMs(period)
  const start = now - windowMs
  const prevStart = start - windowMs
  
  const aliases = 
  campaign === 'all' ? null : new Set((Array.isArray(links) ? links : []).filter((l) => l.campaign === campaign).map((l) => l.alias));

  const inCampaign = (e: ClickEvent) => !aliases || aliases.has(e.alias)
  const current = (Array.isArray(events) ? events : []).filter((e) => inCampaign(e) && new Date(e.timestamp).getTime() >= start)

const previous = (Array.isArray(events) ? events : []).filter((e) => {
  const t = new Date(e.timestamp).getTime()
  return inCampaign(e) && t >= prevStart && t < start
})
   
  const humans = current.filter((e) => !e.bot)
  const prevHumans = previous.filter((e) => !e.bot)
  const bots = current.filter((e) => e.bot)

  const uniqueOf = (list: ClickEvent[]) => new Set(list.map((e) => e.visitorKey || e.location + e.device + e.browser)).size

  const points = period === '24h' ? 24 : period === '7d' ? 7 : 30
  const bucketMs = period === '24h' ? 3600000 : 86400000
  const series = Array.from({ length: points }, (_, i) => {
    const bucketStart = start + i * bucketMs
    const bucketEnd = bucketStart + bucketMs
    const bucket = humans.filter((e) => {
      const t = new Date(e.timestamp).getTime()
      return t >= bucketStart && t < bucketEnd
    })
    let label: string
    const d = new Date(bucketStart)
    if (period === '24h') label = `${String(d.getHours()).padStart(2, '0')}:00`
    else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return {
      label,
      clicks: bucket.length,
      unique: uniqueOf(bucket),
    }
  })

  const deviceCounts = countBy(
    humans.map((e) => ({ key: e.device })),
    ['Mobile', 'Desktop', 'Tablet'],
  ).map((row) => ({
    ...row,
    fill: row.name === 'Mobile' ? 'var(--chart-1)' : row.name === 'Desktop' ? 'var(--chart-2)' : 'var(--chart-4)',
  }))

  const browserOrder = ['Chrome', 'Safari', 'Edge', 'Firefox', 'Samsung Internet', 'Other']
  const browserMap = new Map<string, number>()
  for (const e of humans) {
    const name = browserOrder.includes(e.browser) ? e.browser : 'Other'
    browserMap.set(name, (browserMap.get(name) ?? 0) + 1)
  }
  const browsers = browserOrder
    .map((name) => ({ name, value: browserMap.get(name) ?? 0 }))
    .filter((b) => b.value > 0)

  const top = (key: 'referrer' | 'location', limit: number) => {
    const map = new Map<string, number>()
    for (const e of humans) map.set(e[key], (map.get(e[key]) ?? 0) + 1)
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, value]) => {
        const code = key === 'location' ? name.split(', ').at(-1) : undefined
        return { name, value, code }
      })
  }

  const recent = (Array.isArray(events) ? events : [])
  .filter((e) => e && e.timestamp)
  .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
  .slice(0, 16)

  return {
    series,
    kpis: {
      totalClicks: humans.length,
      unique: uniqueOf(humans),
      bots: bots.length,
      clicksDelta: deltaPct(humans.length, prevHumans.length),
      uniqueDelta: deltaPct(uniqueOf(humans), uniqueOf(prevHumans)),
      botsDelta: deltaPct(bots.length, previous.filter((e) => e.bot).length),
    },
    devices: deviceCounts,
    browsers,
    referrers: top('referrer', 6),
    locations: top('location', 6),
    events: recent,
  }
}
export const getAnalytics = aggregateAnalytics;
export const initialEvents: any[] = [];

export const liveRandom = (arr: any[]) => {
  const safeArr = Array.isArray(arr) && arr.length > 0 ? arr : [null];
  return safeArr[Math.floor(Math.random() * safeArr.length)];
};

export const makeEvent = (link?: any) => ({
  id: 'evt_' + Math.random().toString(36).slice(2, 9),
  linkId: link?.id || 'lnk_1',
  alias: link?.alias || 'diwali-mega',
  timestamp: new Date().toISOString(),
  country: 'India',
  city: 'Mumbai',
  device: 'Mobile' as const,
  browser: 'Chrome',
  os: 'Android',
  referrer: 'Direct',
  isBot: false,
});
