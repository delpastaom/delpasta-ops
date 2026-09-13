import { useEffect, useState } from 'react'
import { useI18n, pickField } from '@/lib/i18n'
import { listInventory, listTransactions } from '@/lib/db'
import type { InventoryItem, InventoryTransaction } from '@/lib/types'
import { money, fmt1 } from '@/lib/status'
import { Card, EmptyState, Tabs } from '@/components/ui'

export default function Reports() {
  const { t, lang } = useI18n()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [txns, setTxns] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('value')

  useEffect(() => {
    Promise.all([listInventory(), listTransactions()])
      .then(([i, x]) => { setItems(i); setTxns(x) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-16 text-center text-muted-foreground text-sm">{t('loading')}</div>

  const totalValue = items.reduce((s, i) => s + Number(i.qty) * Number(i.cost_per_unit), 0)
  const waste = txns.filter((x) => ['waste', 'damaged', 'expired'].includes(x.type)).sort((a, b) => b.datetime.localeCompare(a.datetime))

  return (
    <div>
      <Tabs active={tab} onChange={setTab} tabs={[{ id: 'value', label: t('totalValue') }, { id: 'waste', label: t('waste') }]} />
      {tab === 'value' && (
        <div>
          <Card className="p-4 mb-4 inline-block"><div className="text-xs text-muted-foreground mb-1">{t('totalValue')}</div><b className="text-2xl tabular-nums">{money(totalValue)}</b></Card>
          <Card className="divide-y divide-border">
            {items.length === 0 ? <EmptyState text={t('noResults')} /> : items
              .slice().sort((a, b) => Number(b.qty) * Number(b.cost_per_unit) - Number(a.qty) * Number(a.cost_per_unit))
              .map((it) => (
                <div key={it.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="font-semibold">{pickField(it, 'name', lang)}</span>
                  <span className="tabular-nums text-muted-foreground">{fmt1(it.qty)} {it.unit} · {money(Number(it.qty) * Number(it.cost_per_unit))}</span>
                </div>
              ))}
          </Card>
        </div>
      )}
      {tab === 'waste' && (
        <Card className="divide-y divide-border">
          {waste.length === 0 ? <EmptyState text={t('noResults')} /> : waste.map((x) => {
            const it = items.find((i) => i.id === x.item_id)
            return (
              <div key={x.id} className="px-4 py-2.5 text-sm">
                <div className="font-semibold">{it ? pickField(it, 'name', lang) : ''} — {fmt1(x.qty)} {x.unit}</div>
                <div className="text-xs text-muted-foreground">{x.datetime.slice(0, 10)} · {x.reason}</div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
