import { useEffect, useState } from 'react'
import { Box, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { useI18n, pickField } from '@/lib/i18n'
import { listInventory, listRecipes } from '@/lib/db'
import type { InventoryItem, Recipe } from '@/lib/types'
import { invStatus, daysUntil, fmt1 } from '@/lib/status'
import { Card, EmptyState, Pill } from '@/components/ui'

export default function Dashboard() {
  const { t, lang } = useI18n()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([listInventory(), listRecipes()])
      .then(([i, r]) => { setItems(i); setRecipes(r) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-16 text-center text-muted-foreground text-sm">{t('loading')}</div>

  const low = items.filter((i) => invStatus(i) === 'low')
  const critical = items.filter((i) => invStatus(i) === 'critical')
  const out = items.filter((i) => invStatus(i) === 'out')
  const expiring = items.filter((i) => i.expiry_date && daysUntil(i.expiry_date) <= 5).sort((a, b) => daysUntil(a.expiry_date) - daysUntil(b.expiry_date))
  const needsReview = recipes.filter((r) => r.status === 'pending')

  const tiles = [
    { icon: Box, label: 'totalItems', value: items.length, tone: 'text-primary bg-primary/10' },
    { icon: AlertTriangle, label: 'lowItems', value: low.length + critical.length, tone: 'text-warning bg-warning/10' },
    { icon: XCircle, label: 'outItems', value: out.length, tone: 'text-destructive bg-destructive/10' },
    { icon: Clock, label: 'expSoon', value: expiring.length, tone: 'text-warning bg-warning/10' },
  ] as const

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">{t(tile.label)}</span>
              <div className={`w-7 h-7 rounded-lg grid place-items-center ${tile.tone}`}><tile.icon size={15} /></div>
            </div>
            <b className="text-2xl tabular-nums">{tile.value}</b>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold text-sm mb-2">{t('lowCriticalOut')}</h2>
          <Card className="divide-y divide-border">
            {[...critical, ...low, ...out].length === 0
              ? <EmptyState text={t('noResults')} />
              : [...critical, ...low, ...out].slice(0, 8).map((it) => (
                <div key={it.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{pickField(it, 'name', lang)}</div>
                    <div className="text-xs text-muted-foreground">{fmt1(it.qty)} {it.unit}</div>
                  </div>
                  <Pill tone={invStatus(it) === 'out' ? 'critical' : invStatus(it) === 'critical' ? 'critical' : 'warn'}>{t(invStatus(it) === 'out' ? 'outOfStock' : invStatus(it) === 'critical' ? 'critical' : 'lowStock')}</Pill>
                </div>
              ))}
          </Card>
        </div>

        <div>
          <h2 className="font-bold text-sm mb-2">{t('expiringItems')}</h2>
          <Card className="divide-y divide-border">
            {expiring.length === 0
              ? <EmptyState text={t('noResults')} />
              : expiring.slice(0, 8).map((it) => (
                <div key={it.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{pickField(it, 'name', lang)}</div>
                    <div className="text-xs text-muted-foreground">{it.expiry_date}</div>
                  </div>
                  <Pill tone={daysUntil(it.expiry_date) < 0 ? 'critical' : 'warn'}>{daysUntil(it.expiry_date) < 0 ? t('expiredSt') : `${daysUntil(it.expiry_date)}d`}</Pill>
                </div>
              ))}
          </Card>

          <h2 className="font-bold text-sm mb-2 mt-6">{t('nav_recipes')} — {t('pendingSt')}</h2>
          <Card className="divide-y divide-border">
            {needsReview.length === 0
              ? <EmptyState text={t('noResults')} />
              : needsReview.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="font-semibold text-sm truncate">{pickField(r, 'name', lang)}</div>
                </div>
              ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
