'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { resolveRedirect } from '@/lib/linkpulse/redirect'

export async function unlockLink(alias: string, formData: FormData) {
  const password = String(formData.get('password') ?? '')
  const headersList = await headers()
  const result = await resolveRedirect(alias, headersList, password)
  if (result.type === 'redirect') redirect(result.url)
  if (result.type === 'wrong-password' || result.type === 'password') {
    return { error: 'Incorrect password. Please try again.' }
  }
  return { error: 'This link is no longer available.' }
}
