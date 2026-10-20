import { readDb, updateDb } from '@/lib/db'
import { RESERVED_ALIASES, checkUrl, slugify } from '@/lib/linkpulse/data'
import { toShortLink, type LinkInput } from '@/lib/linkpulse/validate'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = await readDb()
  return Response.json({ links: db.links })
}

export async function POST(request: Request) {
  const body = (await request.json()) as { link?: LinkInput; links?: LinkInput[] }
  const inputs = body.links ?? (body.link ? [body.link] : [])
  if (!inputs.length) return Response.json({ error: 'No links provided' }, { status: 400 })

  try {
    const created: ReturnType<typeof toShortLink>[] = []
    const db = await updateDb((state) => {
      const used = new Set(state.links.map((l) => l.alias))
      for (const input of inputs) {
        const dest = checkUrl(input.destination ?? '', state.blocklist)
        if (dest.state === 'invalid' || dest.state === 'empty' || dest.state === 'unsafe') {
          throw new Error(dest.state === 'empty' ? 'Destination URL is required' : dest.message)
        }
        const alias = slugify(input.alias ?? '')
        if (alias && RESERVED_ALIASES.includes(alias)) throw new Error(`Alias "${alias}" is reserved`)
        if (alias && used.has(alias)) throw new Error(`Alias "${alias}" is already in use`)
        if (input.mobileUrl) {
          const mobile = checkUrl(input.mobileUrl, state.blocklist)
          if (mobile.state === 'invalid' || mobile.state === 'unsafe') throw new Error(mobile.message)
        }
        if (input.desktopUrl) {
          const desktop = checkUrl(input.desktopUrl, state.blocklist)
          if (desktop.state === 'invalid' || desktop.state === 'unsafe') throw new Error(desktop.message)
        }
        const link = toShortLink(input, used)
        created.push(link)
        state.links.unshift(link)
      }
    })
    return Response.json({ links: db.links, created })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not create link' }, { status: 400 })
  }
}
