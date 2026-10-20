import { LinkPulseProvider } from '@/components/linkpulse/store'
import { AppShell } from '@/components/linkpulse/app-shell'

export default function Page() {
  return (
    <LinkPulseProvider>
      <AppShell />
    </LinkPulseProvider>
  )
}
