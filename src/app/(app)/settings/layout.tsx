import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getWorkspaceContext } from '@/lib/workspace'
import { isPlatformAdmin } from '@/lib/platform-admin'

const BASE_TABS = [
  { href: '/settings/workspace', label: 'Workspace' },
  { href: '/settings/members', label: 'Membros' },
  { href: '/settings/lost-reasons', label: 'Motivos de Perda' },
  { href: '/settings/billing', label: 'Assinatura' },
]

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ctx = await getWorkspaceContext()
  if (!ctx) redirect('/onboarding')

  const TABS = (await isPlatformAdmin())
    ? [...BASE_TABS, { href: '/settings/clients', label: 'Clientes' }]
    : BASE_TABS

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie seu workspace, membros e assinatura
        </p>
      </div>

      <nav className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <SettingsTab key={tab.href} href={tab.href} label={tab.label} />
        ))}
      </nav>

      {children}
    </div>
  )
}

function SettingsTab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[active]:text-foreground"
    >
      {label}
    </Link>
  )
}
