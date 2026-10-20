import type { ClickEvent } from '@/lib/linkpulse/analytics'

const BOT_RE =
  /bot|crawler|crawl|spider|slurp|bingpreview|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegram|discordbot|slackbot|preview|headless|phantom|puppeteer|playwright|python-requests|httpclient|axios|go-http|scrapy|curl|wget|libwww|monitor|uptime|pingdom/i

const TABLET_RE = /iPad|Tablet|PlayBook|Silk|Kindle|Nexus 7|Nexus 9|SM-T/i
const MOBILE_RE = /Mobi|Android.*Mobile|iPhone|iPod|Windows Phone|webOS|BlackBerry/i

const LOCATIONS = [
  'Mumbai, IN',
  'Bengaluru, IN',
  'Delhi, IN',
  'Pune, IN',
  'Hyderabad, IN',
  'San Francisco, US',
  'Austin, US',
  'London, GB',
  'Dubai, AE',
  'Singapore, SG',
]

function hash(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function isBotUserAgent(ua: string) {
  return !ua || BOT_RE.test(ua)
}

export function parseDevice(ua: string): ClickEvent['device'] {
  if (TABLET_RE.test(ua)) return 'Tablet'
  if (MOBILE_RE.test(ua)) return 'Mobile'
  return 'Desktop'
}

export function parseBrowser(ua: string) {
  if (!ua) return 'Unknown'
  if (BOT_RE.test(ua)) {
    if (/HeadlessChrome/i.test(ua)) return 'HeadlessChrome'
    if (/python-requests/i.test(ua)) return 'python-requests'
    if (/curl/i.test(ua)) return 'curl'
    if (/wget/i.test(ua)) return 'wget'
    return 'Bot'
  }
  if (/Edg\//i.test(ua)) return 'Edge'
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Internet'
  if (/OPR\/|Opera/i.test(ua)) return 'Opera'
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Chrome'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  if (/Safari/i.test(ua)) return 'Safari'
  return 'Other'
}

export function locationFromIp(ip: string) {
  if (!ip || ip === 'unknown') return LOCATIONS[0]
  return LOCATIONS[hash(ip) % LOCATIONS.length]
}

export function visitorKey(ip: string, ua: string) {
  return `${ip}|${ua.slice(0, 80)}`
}

export function clientIp(headerList: Headers) {
  const forwarded = headerList.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return headerList.get('x-real-ip')?.trim() || headerList.get('cf-connecting-ip')?.trim() || 'unknown'
}

export function normalizeReferrer(raw: string | null) {
  if (!raw) return 'Direct / QR'
  try {
    const host = new URL(raw).hostname.replace(/^www\./, '')
    if (!host) return 'Direct / QR'
    return host
  } catch {
    return raw.slice(0, 64)
  }
}
