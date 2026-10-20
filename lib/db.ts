import { promises as fs } from 'fs'
import path from 'path'
import { generateSeedEvents, type ClickEvent } from '@/lib/linkpulse/analytics'
import {
  CAMPAIGNS,
  INITIAL_BLOCKLIST,
  INITIAL_LINKS,
  INITIAL_REPORTS,
  type Campaign,
  type ShortLink,
  type SuspiciousReport,
} from '@/lib/linkpulse/data'

export type Database = {
  links: ShortLink[]
  campaigns: Campaign[]
  events: ClickEvent[]
  blocklist: string[]
  reports: SuspiciousReport[]
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json')

function seedDatabase(): Database {
  const links = structuredClone(INITIAL_LINKS)
  return {
    links,
    campaigns: structuredClone(CAMPAIGNS),
    events: generateSeedEvents(links),
    blocklist: [...INITIAL_BLOCKLIST],
    reports: structuredClone(INITIAL_REPORTS),
  }
}

let queue: Promise<unknown> = Promise.resolve()

function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const run = queue.then(job, job)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function readFile(): Promise<Database> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8')
    const parsed = JSON.parse(raw) as Partial<Database>
    return {
      links: parsed.links ?? [],
      campaigns: parsed.campaigns ?? [],
      events: parsed.events ?? [],
      blocklist: parsed.blocklist ?? [],
      reports: parsed.reports ?? [],
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    const seed = seedDatabase()
    await fs.writeFile(DB_PATH, JSON.stringify(seed, null, 2), 'utf8')
    return seed
  }
}

async function writeFile(db: Database) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
  const tmp = `${DB_PATH}.tmp`
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8')
  await fs.rename(tmp, DB_PATH).catch(async () => {
    await fs.copyFile(tmp, DB_PATH)
    await fs.unlink(tmp).catch(() => undefined)
  })
}

export function readDb() {
  return enqueue(() => readFile())
}

export function updateDb(mutator: (db: Database) => void) {
  return enqueue(async () => {
    const db = await readFile()
    mutator(db)
    await writeFile(db)
    return db
  })
}
