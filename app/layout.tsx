import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { fetchComissaoResumoConfig } from '@/src/features/comissao/get-comissao-resumo-config-server'
import { getCommissionLogoRelativeUrl, inferLogoMimeFromPath } from '@/src/features/comissao/logo-utils'

import './globals.css'

const APP_TITLE = 'Aprovados • TRT2'
const APP_DESCRIPTION = 'Painel da comissão TJAA TRT-2'
const FALLBACK_ICON = '/logo-tjaa-trt2.png'

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchComissaoResumoConfig()
  const baseUrl = await getRequestBaseUrl()
  const iconRelativeUrl = getCommissionLogoRelativeUrl(config) ?? FALLBACK_ICON
  const iconType = config?.logo_url
    ? inferLogoMimeFromPath(config.logo_storage_path ?? config.logo_url)
    : 'image/png'

  const icons: Metadata['icons'] = {
    icon: [
      { url: iconRelativeUrl, sizes: '32x32', type: iconType },
      { url: iconRelativeUrl, sizes: '192x192', type: iconType },
      { url: iconRelativeUrl, sizes: '512x512', type: iconType },
    ],
    shortcut: [{ url: iconRelativeUrl, type: iconType }],
    apple: [{ url: iconRelativeUrl, sizes: '180x180', type: iconType }],
  }

  return {
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    manifest: '/manifest.webmanifest',
    metadataBase: new URL(baseUrl),
    icons,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className="font-body antialiased text-[#111111]">{children}</body>
    </html>
  )
}

async function getRequestBaseUrl() {
  const headerList = await headers()
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`.replace(/\/$/, '')
}
