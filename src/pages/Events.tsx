import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, Printer, X as XIcon, Users } from 'lucide-react'
import { useI18n, pickField, type TKey } from '@/lib/i18n'
import { useRole } from '@/lib/role'
import { canDo, type BuffetEvent, type BuffetEventFull, type BuffetEventDish, type BuffetEventEquipment, type AssetItem, type Recipe } from '@/lib/types'
import { listEvents, getEvent, saveEvent, deleteEvent, listAssets, listRecipes, logAudit, type EventSaveInput } from '@/lib/db'
import { printEventSheet } from '@/lib/print'
import { Button, Card, Drawer, Modal, Field, Input, Select, Textarea, EmptyState } from '@/components/ui'

type Draft = Partial<BuffetEvent> & {
  dishes: Omit<BuffetEventDish, 'id' | 'event_id'>[]
  equipment: Omit<BuffetEventEquipment, 'id' | 'event_id'>[]
}

function blankDraft(): Draft {
  return { name: '', event_date: null, guest_count: 100, decoration_notes: '', notes: '', dishes: [], equipment: [] }
}
function draftFromFull(e: BuffetEventFull): Draft {
  return {
    ...e,
    dishes: e.buffet_event_dishes.map(({ recipe_id, dish_name, category, plate_count, notes }) => ({ recipe_id, dish_name, category, plate_count, notes, sort_order: 0 })),
    equipment: e.buffet_event_equipment.map(({ asset_item_id, per_guest_multiplier, qty }) => ({ asset_item_id, per_guest_multiplier, qty, sort_order: 0 })),
  }
}

export default function Events() {
  const { t, lang } = useI18n()
  const { role, userName } = useRole()
  const [events, setEvents] = useState<BuffetEvent[]>([])
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<BuffetEventFull | null>(null)
  const [editing, setEditing] = useState<Draft | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([listEvents(), listAssets(), listRecipes()])
      .then(([e, a, r]) => { setEvents(e); setAssets(a); setRecipes(r) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  useEffect(() => {
    if (!detailId) { setDetail(null); return }
    getEvent(detailId).then(setDetail)
  }, [detailId])

  const openEdit = (e?: BuffetEventFull) => {
    if (e) { setEditing(draftFromFull(e)); setEditingId(e.id) }
    else { setEditing(blankDraft()); setEditingId(null) }
  }

  const saveDraft = async () => {
    if (!editing) return
    try {
      const id = await saveEvent({ ...editing, id: editingId || undefined } as EventSaveInput)
      await logAudit(userName || role, role, editingId ? 'event_edit' : 'event_add', editing.name || '')
      setEditing(null); setEditingId(null)
      load()
      if (detailId === id) getEvent(id).then(setDetail)
    } catch (err) { console.error(err) }
  }

  const removeEvent = async (id: string) => {
    if (!confirm(t('delete') + '?')) return
    await deleteEvent(id)
    setDetailId(null); setEditing(null)
    load()
  }

  if (loading) return <div className="py-16 text-center text-muted-foreground text-sm">{t('loading')}</div>

  return (
    <div>
      <div className="flex justify-end mb-4">
        {canDo(role, 'editEvents') && <Button variant="primary" onClick={() => openEdit()}><Plus size={15} /> {t('newEvent')}</Button>}
      </div>

      {events.length === 0 ? (
        <Card><EmptyState text={t('noEventsYet')} /></Card>
      ) : (
        <Card className="divide-y divide-border">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50" onClick={() => setDetailId(e.id)}>
              <div className="w-9 h-9 rounded-lg bg-primary/15 text-accent grid place-items-center flex-none"><Users size={16} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{e.name || '—'}</div>
                <div className="text-xs text-muted-foreground">{e.event_date || ''}</div>
              </div>
              <div className="text-sm font-bold tabular-nums">{e.guest_count}</div>
            </div>
          ))}
        </Card>
      )}

      <Drawer open={!!detailId} onClose={() => setDetailId(null)} title={detail?.name || ''}>
        {detail && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">{detail.event_date}</div>
              <div className="rounded-xl bg-foreground text-background px-4 py-2 text-center">
                <b className="block text-xl tabular-nums">{detail.guest_count}</b>
                <span className="text-[10px] opacity-75">{t('guestCount')}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <Button onClick={() => printEventSheet(detail, assets, lang, t)}><Printer size={15} /> {t('print')}</Button>
              {canDo(role, 'editEvents') && <Button onClick={() => openEdit(detail)}><Edit2 size={15} /> {t('edit')}</Button>}
              {canDo(role, 'editEvents') && <Button variant="danger" onClick={() => removeEvent(detail.id)}><Trash2 size={15} /> {t('delete')}</Button>}
            </div>

            <h3 className="font-bold text-sm mb-2">{t('dishes')}</h3>
            <Card className="divide-y divide-border mb-5">
              {detail.buffet_event_dishes.length === 0 ? <EmptyState text={t('noResults')} /> : detail.buffet_event_dishes.map((d) => (
                <div key={d.id} className="px-4 py-2.5 text-sm">
                  <div className="font-semibold">{d.dish_name} <span className="text-xs text-muted-foreground">· {d.category}</span> <span className="tabular-nums">— {d.plate_count} {t('plateCount')}</span></div>
                  {d.notes && <div className="text-xs text-muted-foreground mt-0.5">{d.notes}</div>}
                </div>
              ))}
            </Card>

            <h3 className="font-bold text-sm mb-2">{t('nav_assets')}</h3>
            <Card className="divide-y divide-border mb-5">
              {detail.buffet_event_equipment.length === 0 ? <EmptyState text={t('noResults')} /> : detail.buffet_event_equipment.map((eq) => {
                const asset = assets.find((a) => a.id === eq.asset_item_id)
                return (
                  <div key={eq.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="font-semibold">{asset ? pickField(asset, 'name', lang) : '—'}</span>
                    <span className="tabular-nums font-bold">{eq.qty}</span>
                  </div>
                )
              })}
            </Card>

            {detail.decoration_notes && (
              <div>
                <h3 className="font-bold text-sm mb-2">{t('decoration')}</h3>
                <p className="text-sm">{detail.decoration_notes}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editingId ? t('edit') : t('newEvent')} wide>
        {editing && (
          <EventForm
            draft={editing}
            setDraft={setEditing}
            assets={assets}
            recipes={recipes}
            t={t}
            lang={lang}
            onCancel={() => setEditing(null)}
            onSave={saveDraft}
          />
        )}
      </Modal>
    </div>
  )
}

function EventForm({ draft, setDraft, assets, recipes, t, lang, onCancel, onSave }: {
  draft: Draft; setDraft: (d: Draft) => void; assets: AssetItem[]; recipes: Recipe[]
  t: (k: TKey) => string; lang: 'ar' | 'en' | 'sw'; onCancel: () => void; onSave: () => void
}) {
  const upd = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })
  const guestCount = draft.guest_count ?? 0

  const addDish = () => upd({ dishes: [...draft.dishes, { recipe_id: null, dish_name: '', category: '', plate_count: 0, notes: '', sort_order: 0 }] })
  const rmDish = (i: number) => upd({ dishes: draft.dishes.filter((_, idx) => idx !== i) })
  const setDish = (i: number, patch: Partial<BuffetEventDish>) => upd({ dishes: draft.dishes.map((d, idx) => idx === i ? { ...d, ...patch } : d) })

  const addEquip = () => upd({ equipment: [...draft.equipment, { asset_item_id: null, per_guest_multiplier: 1, qty: guestCount, sort_order: 0 }] })
  const rmEquip = (i: number) => upd({ equipment: draft.equipment.filter((_, idx) => idx !== i) })
  const setEquip = (i: number, patch: Partial<BuffetEventEquipment>) => upd({ equipment: draft.equipment.map((e, idx) => idx === i ? { ...e, ...patch } : e) })

  const setGuestCount = (n: number) => {
    // Live-recalculate every auto-calculated equipment line when guest count changes.
    const equipment = draft.equipment.map((e) => e.per_guest_multiplier != null ? { ...e, qty: Math.round(n * e.per_guest_multiplier) } : e)
    setDraft({ ...draft, guest_count: n, equipment })
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('eventName')}><Input value={draft.name || ''} onChange={(e) => upd({ name: e.target.value })} /></Field>
        <Field label={t('eventDate')}><Input type="date" value={draft.event_date || ''} onChange={(e) => upd({ event_date: e.target.value || null })} /></Field>
      </div>
      <Field label={t('guestCount')}>
        <Input type="number" min={0} value={guestCount} onChange={(e) => setGuestCount(parseFloat(e.target.value) || 0)} />
      </Field>

      <Field label={t('dishes')}>
        {draft.dishes.map((d, i) => (
          <Card key={i} className="p-2.5 mb-2">
            <div className="grid grid-cols-2 gap-2 mb-1.5">
              <Select
                value={d.recipe_id || ''}
                onChange={(e) => {
                  const r = recipes.find((x) => x.id === e.target.value)
                  setDish(i, { recipe_id: e.target.value || null, dish_name: r ? pickField(r, 'name', lang) : d.dish_name, category: r?.category || d.category })
                }}
              >
                <option value="">{t('pickRecipeOptional')}</option>
                {recipes.map((r) => <option key={r.id} value={r.id}>{pickField(r, 'name', lang)}</option>)}
              </Select>
              <Input placeholder={t('dishName')} value={d.dish_name} onChange={(e) => setDish(i, { dish_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-1.5">
              <Input placeholder={t('dishCategory')} value={d.category} onChange={(e) => setDish(i, { category: e.target.value })} />
              <Input type="number" placeholder={t('plateCount')} value={d.plate_count} onChange={(e) => setDish(i, { plate_count: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex gap-2">
              <Input placeholder={t('notes')} value={d.notes} onChange={(e) => setDish(i, { notes: e.target.value })} />
              <Button variant="danger" size="sm" onClick={() => rmDish(i)}><XIcon size={14} /></Button>
            </div>
          </Card>
        ))}
        <Button size="sm" onClick={addDish}><Plus size={14} /> {t('addDish')}</Button>
      </Field>

      <Field label={t('nav_assets')}>
        {draft.equipment.map((e, i) => (
          <Card key={i} className="p-2.5 mb-2">
            <div className="flex gap-2 mb-1.5">
              <Select value={e.asset_item_id || ''} onChange={(ev) => setEquip(i, { asset_item_id: ev.target.value || null })}>
                <option value="">—</option>
                {assets.map((a) => <option key={a.id} value={a.id}>{pickField(a, 'name', lang)}</option>)}
              </Select>
              <Button variant="danger" size="sm" onClick={() => rmEquip(i)}><XIcon size={14} /></Button>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={e.per_guest_multiplier != null}
                  onChange={(ev) => setEquip(i, { per_guest_multiplier: ev.target.checked ? 1 : null, qty: ev.target.checked ? guestCount : e.qty })}
                />
                {t('autoCalcPerGuest')}
              </label>
              {e.per_guest_multiplier != null ? (
                <>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{t('perGuestMultiplier')}</span>
                  <Input
                    type="number" step="0.1" className="w-20"
                    value={e.per_guest_multiplier}
                    onChange={(ev) => {
                      const m = parseFloat(ev.target.value) || 0
                      setEquip(i, { per_guest_multiplier: m, qty: Math.round(guestCount * m) })
                    }}
                  />
                  <span className="text-xs tabular-nums font-bold">= {e.qty}</span>
                </>
              ) : (
                <Input type="number" className="w-24" placeholder={t('quantity')} value={e.qty} onChange={(ev) => setEquip(i, { qty: parseFloat(ev.target.value) || 0 })} />
              )}
            </div>
          </Card>
        ))}
        <Button size="sm" onClick={addEquip}><Plus size={14} /> {t('addEquipmentLine')}</Button>
      </Field>

      <Field label={t('decorationNotes')}>
        <Textarea value={draft.decoration_notes || ''} onChange={(e) => upd({ decoration_notes: e.target.value })} />
      </Field>
      <Field label={t('notes')}>
        <Textarea value={draft.notes || ''} onChange={(e) => upd({ notes: e.target.value })} />
      </Field>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onCancel}>{t('cancel')}</Button>
        <Button variant="primary" onClick={onSave}>{t('save')}</Button>
      </div>
    </div>
  )
}
