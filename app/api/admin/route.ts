import { readDb, updateDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DOMAIN_RE = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/

export async function GET() {
  const db = await readDb()
  return Response.json({ reports: db.reports, blocklist: db.blocklist })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action: 'add-block' | 'remove-block' | 'resolve-report' | 'takedown'
    domain?: string
    linkId?: string
    reason?: string
  }

  try {
    const db = await updateDb((state) => {
      if (body.action === 'add-block') {
        const domain = (body.domain ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
        if (!DOMAIN_RE.test(domain)) throw new Error('Enter a valid domain, e.g. scam-site.xyz')
        if (!state.blocklist.includes(domain)) state.blocklist.unshift(domain)
      } else if (body.action === 'remove-block') {
        const domain = (body.domain ?? '').trim().toLowerCase()
        state.blocklist = state.blocklist.filter((d) => d !== domain)
      } else if (body.action === 'resolve-report') {
        state.reports = state.reports.filter((r) => r.linkId !== body.linkId)
      } else if (body.action === 'takedown') {
        const link = state.links.find((l) => l.id === body.linkId)
        if (!link) throw new Error('Link not found')
        link.disabledByAdmin = true
        link.disabledReason = body.reason || 'Taken down by admin'
      } else {
        throw new Error('Unknown action')
      }
    })
    return Response.json({
      links: db.links,
      reports: db.reports,
      blocklist: db.blocklist,
    })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Admin action failed' }, { status: 400 })
  }
}
