'use client'

import { useRef, useState } from 'react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { brandedShort, workingShortUrl, type ShortLink } from '@/lib/linkpulse/data'
import { Modal } from '../primitives'
import { useLinkPulse } from '../store'
import { useOrigin } from '../use-origin'

const COLORS = [
  { name: 'Black', value: '#0a0a0a' },
  { name: 'Blue', value: '#2f5bea' },
  { name: 'Green', value: '#15803d' },
  { name: 'Orange', value: '#c2410c' },
]

export function QrModal({ link, onClose }: { link: ShortLink | null; onClose: () => void }) {
  const { toast } = useLinkPulse()
  const origin = useOrigin()
  const [color, setColor] = useState(COLORS[0].value)
  const [withLogo, setWithLogo] = useState(true)
  const canvasWrap = useRef<HTMLDivElement>(null)
  const svgWrap = useRef<HTMLDivElement>(null)

  if (!link) return null
  const url = origin ? workingShortUrl(origin, link.alias) : brandedShort(link.alias)

  function trigger(href: string, filename: string) {
    const a = document.createElement('a')
    a.href = href
    a.download = filename
    a.click()
  }

  function downloadPng() {
    const canvas = canvasWrap.current?.querySelector('canvas')
    if (!canvas) return
    trigger(canvas.toDataURL('image/png'), `${link!.alias}-qr.png`)
    toast({ title: 'QR code downloaded', description: `${link!.alias}-qr.png`, tone: 'success' })
  }

  function downloadSvg() {
    const svg = svgWrap.current?.querySelector('svg')
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const href = URL.createObjectURL(blob)
    trigger(href, `${link!.alias}-qr.svg`)
    URL.revokeObjectURL(href)
    toast({ title: 'QR code downloaded', description: `${link!.alias}-qr.svg`, tone: 'success' })
  }

  const image = withLogo
    ? {
        src:
          'data:image/svg+xml;utf8,' +
          encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" rx="9" fill="${color}"/><path d="M8 21h6l3-8 6 16 3-8h6" stroke="white" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
          ),
        height: 40,
        width: 40,
        excavate: true,
      }
    : undefined

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title="Download QR code"
      description={origin ? workingShortUrl(origin, link.alias) : brandedShort(link.alias)}
      footer={
        <>
          <Button variant="outline" size="lg" onClick={downloadSvg}>
            <Download /> SVG
          </Button>
          <Button size="lg" className="px-4" onClick={downloadPng}>
            <Download /> Download PNG
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-5">
        <div ref={svgWrap} className="rounded-2xl bg-white p-5 ring-1 ring-border">
          <QRCodeSVG value={url} size={200} fgColor={color} level="H" marginSize={0} imageSettings={image} />
        </div>
        <div ref={canvasWrap} className="hidden" aria-hidden>
          <QRCodeCanvas value={url} size={1024} fgColor={color} level="H" marginSize={2} imageSettings={image && { ...image, width: 200, height: 200 }} />
        </div>
        <div className="flex w-full items-center justify-between">
          <span className="text-xs font-medium">Color</span>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                aria-label={c.name}
                aria-pressed={color === c.value}
                className={cn('size-6 rounded-full ring-offset-2 ring-offset-background', color === c.value && 'ring-2 ring-foreground')}
                style={{ background: c.value }}
              />
            ))}
          </div>
        </div>
        <label className="flex w-full items-center justify-between text-xs font-medium">
          Center logo
          <input type="checkbox" checked={withLogo} onChange={(e) => setWithLogo(e.target.checked)} className="size-4 accent-[var(--brand)]" />
        </label>
      </div>
    </Modal>
  )
}
