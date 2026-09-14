import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, Printer } from 'lucide-react'
import { useI18n, pickField, type Lang, type TKey } from '@/lib/i18n'
import { useRole } from '@/lib/role'
import { canDo, type InventoryItem, type InventoryTransaction, type Category, type TxnType } from '@/lib/types'
import { listInventory, listCategories, addInventoryItem, updateInventoryItem, deleteInventoryItem, listTransactions, recordTransaction, logAudit } from '@/lib/db'
import { invStatus, fmt1, money } from '@/lib/status'
import { Button, Card, Drawer, Modal, Field, Input, Select, Textarea, Pill, EmptyState } from '@/components/ui'
import LangTabs from '@/components/LangTabs'
import PhotoUpload from '@/components/PhotoUpload'
import Media from '@/components/Media'
import { printStockCountSheet } from '@/lib/print'

const TXN_TYPES: TxnType[] = ['in', 'out', 'waste', 'damaged', 'adjustment', 'returned', 'expired']
const TXN_LABEL: Record<TxnType, TKey> = { in: 'stockIn', out: 'stockOut', waste: 'waste', damaged: 'damaged', adjustment: 'adjustment', returned: 'returned', expired: 'expiredTx' }

function blankItem(): Partial<InventoryItem> {
  return {
    name_ar: '', name_en: '', name_sw: '', category_id: '', subcategory: '', icon: 'default', unit: 'kg',
    qty: 0, min_level: 0, max_level: 0, supplier: '',
    storage_location_ar: '', storage_location_en: '', storage_location_sw: '',
    storage_method_ar: '', storage_method_en: '', storage_method_sw: '',
    expiry_date: null, batch_number: '', purchase_price: 0, cost_per_unit: 0,
    notes_ar: '', notes_en: '', notes_sw: '', photo_url: null, active: true,
  }
}

export default function Inventory() {
  const { t, lang } = useI18n()
  const { role, userName } = useRole()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<InventoryItem | null>(null)
  const [editing, setEditing] = useState<Partial<InventoryItem> | null>(null)
  const [txnFor, setTxnFor] = useState<InventoryItem | null>(null)
  const [txns, setTxns] = useState<InventoryTransaction[]>([])
  const [langTab, setLangTab] = useState<Lang>('en')
  const [catFilter, setCatFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([listInventory(), listCategories()])
      .then(([i, c]) => { setItems(i); setCats(c) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    if (detail) listTransactions(detail.id).then(setTxns).catch(() => setTxns([]))
  }, [detail?.id])

  // Keep the open detail drawer in sync with the latest fetched quantity
  // (recording a transaction reloads `items`, not `detail`, so without this
  // the drawer kept showing the pre-transaction quantity).
  useEffect(() => {
    setDetail((prev) => (prev ? items.find((i) => i.id === prev.id) ?? prev : prev))
  }, [items])

  const catName = (id: string | null) => {
    const c = cats.find((c) => c.id === id)
    return c ? pickField(c, 'name', lang) : ''
  }

  const saveItem = async () => {
    if (!editing) return
    const data = { ...editing }
    delete (data as any).id
    try {
      if (editing.id) {
        await updateInventoryItem(editing.id, data)
        await logAudit(userName || role, role, 'inventory_edit', pickField(editing, 'name', lang))
      } else {
        const created = await addInventoryItem(data)
        await logAudit(userName || role, role, 'inventory_add', pickField(created, 'name', lang))
      }
      setEditing(null)
      load()
    } catch (e) { console.error(e) }
  }

  const removeItem = async (id: string) => {
    if (!confirm(t('delete') + '?')) return
    await deleteInventoryItem(id)
    setDetail(null); setEditing(null)
    load()
  }

  const filtered = catFilter === 'all' ? items : items.filter((i) => i.category_id === catFilter)

  if (loading) return <div className="py-16 text-center text-muted-foreground text-sm">{t('loading')}</div>

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="w-auto">
          <option value="all">{t('all')} {t('category')}</option>
          {cats.filter((c) => c.kind !== 'asset').map((c) => <option key={c.id} value={c.id}>{pickField(c, 'name', lang)}</option>)}
        </Select>
        <Button
          onClick={() => {
            if (catFilter === 'all') { alert(t('pickCategoryFirst')); return }
            const cat = cats.find((c) => c.id === catFilter)
            printStockCountSheet(filtered, cat ? pickField(cat, 'name', lang) : catFilter, lang, t)
          }}
        >
          <Printer size={15} /> {t('printCountSheet')}
        </Button>
        <div className="flex-1" />
        {canDo(role, 'editInventory') && (
          <Button variant="primary" onClick={() => { setEditing(blankItem()); setLangTab('en') }}><Plus size={15} /> {t('newItem')}</Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState text={t('noItemsYet')} /></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((it) => {
            const s = invStatus(it)
            return (
              <Card key={it.id} className="p-3 cursor-pointer hover:border-primary/40" onClick={() => setDetail(it)}>
                <Media photoUrl={it.photo_url} icon={it.icon} className="aspect-[3/2] rounded-lg mb-2.5 overflow-hidden flex items-center justify-center" />
                <div className="font-bold text-sm truncate">{pickField(it, 'name', lang)}</div>
                <div className="text-xs text-muted-foreground truncate mb-2">{catName(it.category_id)}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tabular-nums">{fmt1(it.qty)} {it.unit}</span>
                  <Pill tone={s === 'ok' ? 'good' : s === 'low' ? 'warn' : 'critical'}>{t(s === 'ok' ? 'inStock' : s === 'low' ? 'lowStock' : s === 'critical' ? 'critical' : 'outOfStock')}</Pill>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Detail drawer */}
      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail ? pickField(detail, 'name', lang) : ''}>
        {detail && (
          <div>
            <Media photoUrl={detail.photo_url} icon={detail.icon} className="aspect-[16/9] rounded-xl mb-4 overflow-hidden flex items-center justify-center" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs bg-muted rounded-full px-2.5 py-1 font-semibold">{catName(detail.category_id)}</span>
              {(() => { const s = invStatus(detail); return <Pill tone={s === 'ok' ? 'good' : s === 'low' ? 'warn' : 'critical'}>{t(s === 'ok' ? 'inStock' : s === 'low' ? 'lowStock' : s === 'critical' ? 'critical' : 'outOfStock')}</Pill> })()}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <KV label={t('quantity')} value={`${fmt1(detail.qty)} ${detail.unit}`} />
              <KV label={`${t('min')} / ${t('max')}`} value={`${fmt1(detail.min_level)} / ${fmt1(detail.max_level)}`} />
              <KV label={t('costPerUnit')} value={money(detail.cost_per_unit)} />
              <KV label={t('supplier')} value={detail.supplier || '—'} />
              <KV label={t('storage')} value={pickField(detail, 'storage_location', lang) || '—'} />
              <KV label={t('expiry')} value={detail.expiry_date || '—'} />
            </div>
            {pickField(detail, 'notes', lang) && <p className="text-sm mb-4">{pickField(detail, 'notes', lang)}</p>}
            <div className="flex flex-wrap gap-2 mb-6">
              {canDo(role, 'recordTxn') && <Button variant="primary" onClick={() => setTxnFor(detail)}><Plus size={15} /> {t('recordTransaction')}</Button>}
              {canDo(role, 'editInventory') && <Button onClick={() => { setEditing(detail); setLangTab('en') }}><Edit2 size={15} /> {t('edit')}</Button>}
              {canDo(role, 'editInventory') && <Button variant="danger" onClick={() => removeItem(detail.id)}><Trash2 size={15} /> {t('delete')}</Button>}
            </div>
            <h3 className="font-bold text-sm mb-2">{t('transactionHistory')}</h3>
            <Card className="divide-y divide-border">
              {txns.length === 0 ? <EmptyState text={t('noResults')} /> : txns.slice(0, 25).map((x) => (
                <div key={x.id} className="px-3 py-2 text-sm">
                  <div className="font-semibold">{t(TXN_LABEL[x.type])} · {(x.type === 'in' || x.type === 'returned') ? '+' : '-'}{fmt1(x.qty)} {x.unit}</div>
                  <div className="text-xs text-muted-foreground">{x.datetime.slice(0, 16).replace('T', ' ')} · {x.user_name}{x.reason ? ' · ' + x.reason : ''}</div>
                </div>
              ))}
            </Card>
          </div>
        )}
      </Drawer>

      {/* Add/Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? t('edit') : t('newItem')} wide>
        {editing && (
          <div>
            <LangTabs active={langTab} onChange={setLangTab} />
            <Field label={`${t('name')} (${langTab})`}>
              <Input value={(editing as any)[`name_${langTab}`] || ''} onChange={(e) => setEditing({ ...editing, [`name_${langTab}`]: e.target.value })} />
            </Field>
            <PhotoUpload folder="inventory" url={editing.photo_url} onChange={(url) => setEditing({ ...editing, photo_url: url })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('category')}>
                <Select value={editing.category_id || ''} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}>
                  <option value="">—</option>
                  {cats.filter((c) => c.kind !== 'asset').map((c) => <option key={c.id} value={c.id}>{pickField(c, 'name', lang)}</option>)}
                </Select>
              </Field>
              <Field label={t('unit')}>
                <Input value={editing.unit || ''} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('quantity')}>
                <Input type="number" value={editing.qty ?? 0} onChange={(e) => setEditing({ ...editing, qty: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label={`${t('costPerUnit')} (OMR)`}>
                <Input type="number" step="0.001" value={editing.cost_per_unit ?? 0} onChange={(e) => setEditing({ ...editing, cost_per_unit: parseFloat(e.target.value) || 0 })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('min')}>
                <Input type="number" value={editing.min_level ?? 0} onChange={(e) => setEditing({ ...editing, min_level: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label={t('max')}>
                <Input type="number" value={editing.max_level ?? 0} onChange={(e) => setEditing({ ...editing, max_level: parseFloat(e.target.value) || 0 })} />
              </Field>
            </div>
            <Field label={t('supplier')}>
              <Input value={editing.supplier || ''} onChange={(e) => setEditing({ ...editing, supplier: e.target.value })} />
            </Field>
            <Field label={`${t('storage')} (${langTab})`}>
              <Input value={(editing as any)[`storage_location_${langTab}`] || ''} onChange={(e) => setEditing({ ...editing, [`storage_location_${langTab}`]: e.target.value })} />
            </Field>
            <Field label={`${t('storageMethod')} (${langTab})`}>
              <Input value={(editing as any)[`storage_method_${langTab}`] || ''} onChange={(e) => setEditing({ ...editing, [`storage_method_${langTab}`]: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('expiry')}>
                <Input type="date" value={editing.expiry_date || ''} onChange={(e) => setEditing({ ...editing, expiry_date: e.target.value || null })} />
              </Field>
              <Field label={t('batch')}>
                <Input value={editing.batch_number || ''} onChange={(e) => setEditing({ ...editing, batch_number: e.target.value })} />
              </Field>
            </div>
            <Field label={`${t('notes')} (${langTab})`}>
              <Textarea value={(editing as any)[`notes_${langTab}`] || ''} onChange={(e) => setEditing({ ...editing, [`notes_${langTab}`]: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => setEditing(null)}>{t('cancel')}</Button>
              <Button variant="primary" onClick={saveItem}>{t('save')}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Transaction modal */}
      <Modal open={!!txnFor} onClose={() => setTxnFor(null)} title={t('recordTransaction')}>
        {txnFor && <TxnForm item={txnFor} onDone={() => { setTxnFor(null); load(); if (detail) listTransactions(detail.id).then(setTxns) }} />}
      </Modal>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</div><div className="text-sm font-semibold">{value}</div></div>
}

function TxnForm({ item, onDone }: { item: InventoryItem; onDone: () => void }) {
  const { t } = useI18n()
  const { role, userName } = useRole()
  const [type, setType] = useState<TxnType>('in')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const q = parseFloat(qty)
    if (!q || q <= 0) return
    setSaving(true)
    try {
      await recordTransaction(item, type, q, userName || role, reason, notes)
      onDone()
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('type')}>
          <Select value={type} onChange={(e) => setType(e.target.value as TxnType)}>
            {TXN_TYPES.map((tt) => <option key={tt} value={tt}>{t(TXN_LABEL[tt])}</option>)}
          </Select>
        </Field>
        <Field label={`${t('quantity')} (${item.unit})`}>
          <Input type="number" step="any" value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
      </div>
      <Field label={t('reason')}><Input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <Field label={t('notes')}><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onDone}>{t('cancel')}</Button>
        <Button variant="primary" disabled={saving} onClick={submit}>{t('save')}</Button>
      </div>
    </div>
  )
}
