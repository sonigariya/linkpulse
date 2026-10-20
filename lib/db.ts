import { promises as fs } from 'fs'
import path from 'path'
import { getStore } from '@netlify/blobs'
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
const STORE_NAME = 'linkpulse'
const BLOB_KEY = 'db'

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

function normalize(parsed: Partial<Database>): Database {
  return {
    links: parsed.links ?? [],
    campaigns: parsed.campaigns ?? [],
    events: parsed.events ?? [],
    blocklist: parsed.blocklist ?? [],
    reports: parsed.reports ?? [],
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

/* ---------- Netlify Blobs (used when deployed on Netlify) ---------- */

async function tryReadBlob(): Promise<{ ok: boolean; data: Partial<Database> | null }> {
  try {
    const data = (await getStore(STORE_NAME).get(BLOB_KEY, {
      type: 'json',
      consistency: 'strong',
    })) as Partial<Database> | null
    return { ok: true, data }
  } catch {
    return { ok: false, data: null }
  }
}

async function tryWriteBlob(db: Database): Promise<boolean> {
  try {
    await getStore(STORE_NAME).setJSON(BLOB_KEY, db)
    return true
  } catch {
    return false
  }
}

/* ---------- Local file (used on your laptop with pnpm dev) ---------- */

async function readLocalFile(): Promise<Database> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8')
    return normalize(JSON.parse(raw) as Partial<Database>)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    const seed = seedDatabase()
    await fs.writeFile(DB_PATH, JSON.stringify(seed, null, 2), 'utf8')
    return seed
  }
}

async function writeLocalFile(db: Database) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
  const tmp = `${DB_PATH}.tmp`
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8')
  await fs.rename(tmp, DB_PATH).catch(async () => {
    await fs.copyFile(tmp, DB_PATH)
    await fs.unlink(tmp).catch(() => undefined)
  })
}

/* ---------- Combined store ---------- */

async function readStore(): Promise<Database> {
  const blob = await tryReadBlob()
  if (blob.ok) {
    if (blob.data) return normalize(blob.data)
    const seed = seedDatabase()
    await tryWriteBlob(seed)
    return seed
  }
  return readLocalFile()
}

async function writeStore(db: Database) {
  if (await tryWriteBlob(db)) return
  await writeLocalFile(db)
}

export function readDb() {
  return enqueue(() => readStore())
}

export function updateDb(mutator: (db: Database) => void) {
  return enqueue(async () => {
    const db = await readStore()
    mutator(db)
    await writeStore(db)
    return db
  })
}
