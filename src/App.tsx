import { Routes, Route } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import { I18nProvider, useI18n } from '@/lib/i18n'
import { RoleProvider } from '@/lib/role'
import { isSupabaseConfigured } from '@/lib/supabase'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import Inventory from '@/pages/Inventory'
import Assets from '@/pages/Assets'
import Events from '@/pages/Events'
import Recipes from '@/pages/Recipes'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'

function NotConfigured() {
  const { t } = useI18n()
  return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div className="max-w-md">
        <div className="w-11 h-11 rounded-xl bg-destructive/15 text-destructive grid place-items-center mx-auto mb-3">
          <AlertTriangle size={22} />
        </div>
        <h1 className="font-bold text-lg mb-2">{t('appName')}</h1>
        <p className="text-sm text-muted-foreground">{t('dbNotConfigured')}</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  if (!isSupabaseConfigured()) return <NotConfigured />
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/events" element={<Events />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <RoleProvider>
        <AppRoutes />
      </RoleProvider>
    </I18nProvider>
  )
}
