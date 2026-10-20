import { readDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = await readDb()
  return Response.json({
    links: db.links,
    campaigns: db.campaigns,
    blocklist: db.blocklist,
    reports: db.reports,
  })
}
