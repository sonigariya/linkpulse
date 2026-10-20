import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { resolveRedirect } from '@/lib/linkpulse/redirect'
import { DisabledGate, ExpiredGate, MissingGate, PasswordForm } from './gate-ui'

export const dynamic = 'force-dynamic'

export default async function RedirectPage({ params }: { params: Promise<{ alias: string }> }) {
  const { alias } = await params
  const headersList = await headers()
  const result = await resolveRedirect(alias, headersList)

  if (result.type === 'redirect') redirect(result.url)
  if (result.type === 'not-found') return <MissingGate alias={alias} />
  if (result.type === 'disabled') {
    return <DisabledGate alias={result.link.alias} reason={result.link.disabledReason || 'Disabled by an administrator'} />
  }
  if (result.type === 'expired') return <ExpiredGate alias={result.link.alias} capped={false} />
  if (result.type === 'capped') return <ExpiredGate alias={result.link.alias} capped />
  return <PasswordForm alias={result.link.alias} />
}
