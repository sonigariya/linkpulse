import { updateDb } from '@/lib/db'
import { checkUrl, type ShortLink } from '@/lib/linkpulse/data'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const patch = (await request.json()) as Partial<ShortLink>

  try {
    const db = await updateDb((state) => {
      const link = state.links.find((l) => l.id === id)
      if (!link) throw new Error('NOT_FOUND')
      if (patch.destination) {
        const dest = checkUrl(patch.destination, state.blocklist)
        if (dest.state === 'invalid' || dest.state === 'unsafe') throw new Error(dest.message)
      }
      Object.assign(link, patch, { id: link.id, alias: link.alias, clicks: patch.clicks ?? link.clicks })
    })
    const link = db.links.find((l) => l.id === id)
    return Response.json({ link, links: db.links })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed'
    if (message === 'NOT_FOUND') return Response.json({ error: 'Link not found' }, { status: 404 })
    return Response.json({ error: message }, { status: 400 })
  }
}
