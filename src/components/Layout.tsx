import { type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { LayoutDashboard, Package, UtensilsCrossed, BookOpen, BarChart3, Settings, Globe, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useRole } from '@/lib/role'
import type { Role } from '@/lib/types'
import { verifyAdminPin } from '@/lib/db'
import { isSupabaseConfigured } from '@/lib/supabase'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'nav_dashboard' as const, end: true },
  { to: '/inventory', icon: Package, label: 'nav_inventory' as const },
  { to: '/assets', icon: UtensilsCrossed, label: 'nav_assets' as const },
  { to: '/recipes', icon: BookOpen, label: 'nav_recipes' as const },
  { to: '/reports', icon: BarChart3, label: 'nav_reports' as const },
  { to: '/settings', icon: Settings, label: 'nav_settings' as const },
]

function currentTitleKey(pathname: string): (typeof NAV)[number]['label'] {
  const match = [...NAV].sort((a, b) => b.to.length - a.to.length).find((n) => pathname === n.to || (n.to !== '/' && pathname.startsWith(n.to)))
  return match?.label ?? 'nav_dashboard'
}

export default function Layout({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n()
  const { role, setRole } = useRole()
  const location = useLocation()
  const titleKey = currentTitleKey(location.pathname)

  const handleRoleChange = async (next: Role) => {
    if ((next === 'admin' || next === 'manager') && isSupabaseConfigured()) {
      const pin = window.prompt(t('enterPin'))
      if (pin === null) return
      const ok = await verifyAdminPin(pin).catch(() => false)
      if (!ok) { window.alert(t('wrongPin')); return }
    }
    setRole(next)
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-56 flex-none flex-col bg-sidebar text-sidebar-foreground border-e border-sidebar-border sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center font-bold text-sm text-white">DP</div>
          <div className="leading-tight">
            <div className="font-bold text-sm">{t('appName')}</div>
            <div className="text-[10px] opacity-70">{t('appSub')}</div>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-0.5 px-2.5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`
              }
            >
              <n.icon size={17} className="opacity-90" />
              {t(n.label)}
            </NavLink>
          ))}
        </nav>
        <div className="p-2.5 flex flex-col gap-2 border-t border-sidebar-border">
          <label className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 text-xs">
            <Globe size={13} className="opacity-70" />
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              className="bg-transparent flex-1 outline-none text-xs"
            >
              <option value="en" className="text-black">English</option>
              <option value="ar" className="text-black">العربية</option>
              <option value="sw" className="text-black">Kiswahili</option>
            </select>
          </label>
          <label className="flex items-center gap-2 bg-white/5 rounded-lg px-2.5 py-1.5 text-xs">
            <ShieldCheck size={13} className="opacity-70" />
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as Role)}
              className="bg-transparent flex-1 outline-none text-xs"
            >
              <option value="admin" className="text-black">{t('admin')}</option>
              <option value="manager" className="text-black">{t('manager')}</option>
              <option value="staff" className="text-black">{t('staff')}</option>
              <option value="viewer" className="text-black">{t('viewer')}</option>
            </select>
          </label>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
          <div className="max-w-6xl w-full mx-auto px-4 md:px-6 py-4">
            <h1 className="font-display text-xl md:text-2xl font-semibold">{t(titleKey)}</h1>
          </div>
        </div>
        <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto pb-20 md:pb-6">{children}</main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex z-40">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`
            }
          >
            <n.icon size={18} />
            {t(n.label)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
