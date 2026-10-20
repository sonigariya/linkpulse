import { readDb } from '@/lib/db'
import { aggregateAnalytics, type Period } from '@/lib/linkpulse/analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const period = (url.searchParams.get('period') as Period) || '7d'
  const campaign = url.searchParams.get('campaign') || 'all'
  const db = await readDb()
  const data = aggregateAnalytics(db.events, db.links, period, campaign)
  return Response.json(data)
}
