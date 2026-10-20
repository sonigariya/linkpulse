import { readDb, updateDb } from '@/lib/db'
import type { Campaign } from '@/lib/linkpulse/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = await readDb()
  return Response.json({ campaigns: db.campaigns })
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Campaign>
  const name = body.name?.trim() ?? ''
  const goal = Number(body.goal)
  if (name.length < 2) return Response.json({ error: 'Name is required' }, { status: 400 })
  if (!Number.isFinite(goal) || goal <= 0) return Response.json({ error: 'Goal must be a positive number' }, { status: 400 })

  try {
    const db = await updateDb((state) => {
      if (state.campaigns.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('A campaign with this name exists')
      }
      const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
      state.campaigns.push({
        name,
        goal,
        color: body.color || palette[state.campaigns.length % palette.length],
      })
    })
    return Response.json({ campaigns: db.campaigns })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Could not create campaign' }, { status: 400 })
  }
}
