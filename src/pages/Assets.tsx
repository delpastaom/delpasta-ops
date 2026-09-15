import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useI18n, pickField, type Lang } from '@/lib/i18n'
import { useRole } from '@/lib/role'
import { canDo, type AssetItem, type Category, type AssetCondition } from '@/lib/types'
import { listAssets, listCategories, addAsset, updateAsset, deleteAsset, addCategory, logAudit } from '@/lib/db'
import { fmt1 } from '@/lib/status'
import { Button, Card, Drawer, Modal, Field, Input, Select, Textarea, Pill, EmptyState } from '@/components/ui'
import LangTabs from '@/components/LangTabs'
import PhotoUpload from '@/components/PhotoUpload'
import Media from '@/components/Media'

const CONDITIONS: AssetCondition[] = ['new', 'excellent', 'good', 'usable', 'damaged', 'needs_repair', 'unusable']
const CONDITION_TONE: Record<AssetCondition, 'good' | 'warn' | 'critical' | 'muted'> = {
  new: 'good', excellent: 'good', good: 'good', usable: 'warn', damaged: 'critical', needs_repair: 'critical', unusable: 'critical',
}

function blankAsset(): Partial<AssetItem> {
  return {
    name_ar: '', name_en: '', name_sw: '', category_id: '', material: '', size_type: '',
    total_qty: 0, available_qty: 0, damaged_qty: 0, missing_qty: 0, condition: 'good',
    storage_location_ar: '', storage_location_en: '', storage_location_sw: '',
    notes: '', photo_url: null, active: true,
  }
}

export default function Assets() {
  const { t, lang } = useI18n()
  const { role, userName } = useRole()
  const [items, setItems] = useState<AssetItem[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<AssetItem | null>(null)
  const [editing, setEditing] = useState<Partial<AssetItem> | null>(null)
  const [langTab, setLangTab] = useState<Lang>('en')
  const [catFilter, setCatFilter] = useState('all')
  const [addingCat, setAddingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([listAssets(), listCategories()])
      .then(([i, c]) => { setItems(i); setCats(c) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

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
        await updateAsset(editing.id, data)
        await logAudit(userName || role, role, 'asset_edit', pickField(editing, 'name', lang))
      } else {
        const created = await addAsset(data)
        await logAudit(userName || role, role, 'asset_add', pickField(created, 'name', lang))
      }
      setEditing(null)
      load()
    } catch (e) { console.error(e) }
  }

  const removeItem = async (id: string) => {
    if (!confirm(t('delete') + '?')) return
    await deleteAsset(id)
    setDetail(null); setEditing(null)
    load()
  }

  const quickAddCategory = async () => {
    const name = newCatName.trim()
    if (!name) return
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const id = 'asset-' + (slug || crypto.randomUUID().slice(0, 8))
    await addCategory({ id, name_ar: name, name_en: name, name_sw: name, kind: 'asset' })
    setNewCatName(''); setAddingCat(false)
    const fresh = await listCategories()
    setCats(fresh)
    if (editing) setEditing({ ...editing, category_id: id })
  }

  const assetCats = cats.filter((c) => c.kind === 'asset')
  const filtered = catFilter === 'all' ? items : items.filter((i) => i.category_id === catFilter)

  if (loading) return <div className="py-16 text-center text-muted-foreground text-sm">{t('loading')}</div>

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="w-auto">
          <option value="all">{t('all')} {t('category')}</option>
          {assetCats.map((c) => <option key={c.id} value={c.id}>{pickField(c, 'name', lang)}</option>)}
        </Select>
        <div className="flex-1" />
        {canDo(role, 'editAssets') && (
          <Button variant="primary" onClick={() => { setEditing(blankAsset()); setLangTab('en') }}><Plus size={15} /> {t('newAsset')}</Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState text={t('noAssetsYet')} /></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((it) => (
            <Card key={it.id} className="p-3 cursor-pointer hover:border-primary/40" onClick={() => setDetail(it)}>
              <Media photoUrl={it.photo_url} icon="tray" className="aspect-[3/2] rounded-lg mb-2.5 overflow-hidden flex items-center justify-center" />
              <div className="font-bold text-sm truncate">{pickField(it, 'name', lang)}</div>
              <div className="text-xs text-muted-foreground truncate mb-2">{catName(it.category_id)}</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tabular-nums">{t('available')}: {fmt1(it.available_qty)}/{fmt1(it.total_qty)}</span>
                <Pill tone={CONDITION_TONE[it.condition]}>{t(`cond_${it.condition}` as any)}</Pill>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail ? pickField(detail, 'name', lang) : ''}>
        {detail && (
          <div>
            <Media photoUrl={detail.photo_url} icon="tray" className="aspect-[16/9] rounded-xl mb-4 overflow-hidden flex items-center justify-center" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs bg-muted rounded-full px-2.5 py-1 font-semibold">{catName(detail.category_id)}</span>
              <Pill tone={CONDITION_TONE[detail.condition]}>{t(`cond_${detail.condition}` as any)}</Pill>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <KV label={t('totalOwned')} value={fmt1(detail.total_qty)} />
              <KV label={t('available')} value={fmt1(detail.available_qty)} />
              <KV label={t('damagedQty')} value={fmt1(detail.damaged_qty)} />
              <KV label={t('missingQty')} value={fmt1(detail.missing_qty)} />
              <KV label={t('material')} value={detail.material || '—'} />
              <KV label={t('sizeType')} value={detail.size_type || '—'} />
              <KV label={t('storage')} value={pickField(detail, 'storage_location', lang) || '—'} />
            </div>
            {detail.notes && <p className="text-sm mb-4">{detail.notes}</p>}
            <div className="flex flex-wrap gap-2">
              {canDo(role, 'editAssets') && <Button onClick={() => { setEditing(detail); setLangTab('en') }}><Edit2 size={15} /> {t('edit')}</Button>}
              {canDo(role, 'editAssets') && <Button variant="danger" onClick={() => removeItem(detail.id)}><Trash2 size={15} /> {t('delete')}</Button>}
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? t('edit') : t('newAsset')} wide>
        {editing && (
          <div>
            <LangTabs active={langTab} onChange={setLangTab} />
            <Field label={`${t('name')} (${langTab})`}>
              <Input value={(editing as any)[`name_${langTab}`] || ''} onChange={(e) => setEditing({ ...editing, [`name_${langTab}`]: e.target.value })} />
            </Field>
            <PhotoUpload folder="assets" url={editing.photo_url} onChange={(url) => setEditing({ ...editing, photo_url: url })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('category')}>
                {!addingCat ? (
                  <div className="flex gap-1.5">
                    <Select value={editing.category_id || ''} onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}>
                      <option value="">—</option>
                      {assetCats.map((c) => <option key={c.id} value={c.id}>{pickField(c, 'name', lang)}</option>)}
                    </Select>
                    <Button type="button" size="sm" onClick={() => setAddingCat(true)}><Plus size={14} /></Button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <Input autoFocus value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder={t('newCategory')} />
                    <Button type="button" size="sm" variant="primary" onClick={quickAddCategory}>{t('add')}</Button>
                    <Button type="button" size="sm" onClick={() => { setAddingCat(false); setNewCatName('') }}>{t('cancel')}</Button>
                  </div>
                )}
              </Field>
              <Field label={t('condition')}>
                <Select value={editing.condition || 'good'} onChange={(e) => setEditing({ ...editing, condition: e.target.value as AssetCondition })}>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{t(`cond_${c}` as any)}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('material')}><Input value={editing.material || ''} onChange={(e) => setEditing({ ...editing, material: e.target.value })} /></Field>
              <Field label={t('sizeType')}><Input value={editing.size_type || ''} onChange={(e) => setEditing({ ...editing, size_type: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('totalOwned')}><Input type="number" value={editing.total_qty ?? 0} onChange={(e) => setEditing({ ...editing, total_qty: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label={t('available')}><Input type="number" value={editing.available_qty ?? 0} onChange={(e) => setEditing({ ...editing, available_qty: parseFloat(e.target.value) || 0 })} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('damagedQty')}><Input type="number" value={editing.damaged_qty ?? 0} onChange={(e) => setEditing({ ...editing, damaged_qty: parseFloat(e.target.value) || 0 })} /></Field>
              <Field label={t('missingQty')}><Input type="number" value={editing.missing_qty ?? 0} onChange={(e) => setEditing({ ...editing, missing_qty: parseFloat(e.target.value) || 0 })} /></Field>
            </div>
            <Field label={`${t('storage')} (${langTab})`}>
              <Input value={(editing as any)[`storage_location_${langTab}`] || ''} onChange={(e) => setEditing({ ...editing, [`storage_location_${langTab}`]: e.target.value })} />
            </Field>
            <Field label={t('notes')}>
              <Textarea value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2 mt-4">
              <Button onClick={() => setEditing(null)}>{t('cancel')}</Button>
              <Button variant="primary" onClick={saveItem}>{t('save')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</div><div className="text-sm font-semibold">{value}</div></div>
}
