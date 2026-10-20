import { updateDb } from '@/lib/db'
import { checkUrl, slugify } from '@/lib/linkpulse/data'
import { toShortLink } from '@/lib/linkpulse/validate'

export const dynamic = 'force-dynamic'

type Row = { url: string; alias?: string; campaign?: string; tags?: string[] }

export async function POST(request: Request) {
  const body = (await request.json()) as { rows?: Row[] }
  const rows = body.rows ?? []
  if (!rows.length) return Response.json({ error: 'No rows to import' }, { status: 400 })

  const db = await updateDb((state) => {
    const used = new Set(state.links.map((l) => l.alias))
    const seen = new Set<string>()
    for (const row of rows) {
      const check = checkUrl(row.url ?? '', state.blocklist)
      if (check.state === 'invalid' || check.state === 'empty' || check.state === 'unsafe') continue
      const alias = slugify(row.alias ?? '')
      if (alias && (used.has(alias) || seen.has(alias))) continue
      if (alias) seen.add(alias)
      const link = toShortLink(
        {
          alias,
          destination: row.url,
          campaign: row.campaign || 'Newsletter',
          tags: row.tags ?? [],
        },
        used,
      )
      state.links.unshift(link)
    }
  })

  return Response.json({ links: db.links })
}
