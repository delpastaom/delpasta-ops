import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2, Printer, Check, X as XIcon } from 'lucide-react'
import { useI18n, pickField, type Lang } from '@/lib/i18n'
import { useRole } from '@/lib/role'
import { canDo, type Recipe, type RecipeFull, type InventoryItem, type RecipeEquipment, type RecipeIngredient, type RecipeStep, type RecipeQcCheckpoint } from '@/lib/types'
import { listRecipes, getRecipe, saveRecipe, deleteRecipe, setRecipeStatus, listInventory, uploadPhoto, logAudit, type RecipeSaveInput } from '@/lib/db'
import { fmt1, money } from '@/lib/status'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Button, Card, Drawer, Modal, Field, Input, Select, Textarea, Pill, Tabs, EmptyState } from '@/components/ui'
import LangTabs from '@/components/LangTabs'
import PhotoUpload from '@/components/PhotoUpload'
import Media from '@/components/Media'

const ICONS = ['default', 'cheese', 'onion', 'pastry', 'samosa', 'oil', 'spice', 'starch', 'packaging', 'tray', 'meat', 'veg']

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || crypto.randomUUID().slice(0, 8)
}

type Draft = Partial<Recipe> & {
  equipment: Omit<RecipeEquipment, 'id' | 'recipe_id'>[]
  ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]
  steps: Omit<RecipeStep, 'id' | 'recipe_id'>[]
  qc: Omit<RecipeQcCheckpoint, 'id' | 'recipe_id'>[]
}

function blankDraft(): Draft {
  return {
    name_ar: '', name_en: '', name_sw: '', category: '', status: 'draft', base_yield: 100,
    yield_unit_ar: 'قطعة', yield_unit_en: 'pieces', yield_unit_sw: 'vipande',
    prep_time_min: 30, cook_time_min: 15,
    storage_instructions_ar: '', storage_instructions_en: '', storage_instructions_sw: '',
    shelf_life_ar: '', shelf_life_en: '', shelf_life_sw: '',
    common_mistakes_ar: '', common_mistakes_en: '', common_mistakes_sw: '',
    photo_url: null,
    equipment: [], ingredients: [], steps: [], qc: [],
  }
}

function draftFromFull(r: RecipeFull): Draft {
  return {
    ...r,
    equipment: r.recipe_equipment.map(({ name_ar, name_en, name_sw }) => ({ name_ar, name_en, name_sw, sort_order: 0 })),
    ingredients: r.recipe_ingredients.map(({ item_id, qty, unit, prep_state_ar, prep_state_en, prep_state_sw, optional, notes }) =>
      ({ item_id, qty, unit, prep_state_ar, prep_state_en, prep_state_sw, optional, notes, sort_order: 0 })),
    steps: r.recipe_steps.map(({ step_number, icon, short_ar, short_en, short_sw, detailed_ar, detailed_en, detailed_sw, warning_ar, warning_en, warning_sw, qc_ar, qc_en, qc_sw, photo_url }) =>
      ({ step_number, icon, short_ar, short_en, short_sw, detailed_ar, detailed_en, detailed_sw, warning_ar, warning_en, warning_sw, qc_ar, qc_en, qc_sw, photo_url })),
    qc: r.recipe_qc_checkpoints.map(({ text_ar, text_en, text_sw }) => ({ text_ar, text_en, text_sw, sort_order: 0 })),
  }
}

export default function Recipes() {
  const { t, lang } = useI18n()
  const { role, userName } = useRole()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<RecipeFull | null>(null)
  const [editing, setEditing] = useState<Draft | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [langTab, setLangTab] = useState<Lang>('en')
  const [tab, setTab] = useState('overview')
  const [scaleQty, setScaleQty] = useState(100)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([listRecipes(), listInventory()]).then(([r, i]) => { setRecipes(r); setItems(i) }).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  useEffect(() => {
    if (!detailId) { setDetail(null); return }
    getRecipe(detailId).then((r) => { setDetail(r); if (r) setScaleQty(r.base_yield) })
  }, [detailId])

  const openEdit = (r?: RecipeFull) => {
    setLangTab('en'); setTab('overview')
    if (r) { setEditing(draftFromFull(r)); setEditingId(r.id) }
    else { setEditing(blankDraft()); setEditingId(null) }
  }

  const saveDraft = async () => {
    if (!editing) return
    const id = editingId || slugify(editing.name_en || editing.name_ar || editing.name_sw || '')
    try {
      await saveRecipe({ ...editing, id } as RecipeSaveInput, !editingId)
      await logAudit(userName || role, role, editingId ? 'recipe_edit' : 'recipe_add', pickField(editing, 'name', lang))
      setEditing(null); setEditingId(null)
      load()
      if (detailId === id) getRecipe(id).then(setDetail)
    } catch (e) { console.error(e) }
  }

  const removeRecipe = async (id: string) => {
    if (!confirm(t('delete') + '?')) return
    await deleteRecipe(id)
    setDetailId(null); setEditing(null)
    load()
  }

  const approve = async (id: string) => {
    await setRecipeStatus(id, 'approved')
    getRecipe(id).then(setDetail)
    load()
  }

  if (loading) return <div className="py-16 text-center text-muted-foreground text-sm">{t('loading')}</div>

  return (
    <div>
      <div className="flex justify-end mb-4">
        {canDo(role, 'editRecipe') && <Button variant="primary" onClick={() => openEdit()}><Plus size={15} /> {t('newRecipe')}</Button>}
      </div>

      {recipes.length === 0 ? (
        <Card><EmptyState text={t('noRecipesYet')} /></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {recipes.map((r) => (
            <Card key={r.id} className="p-3 cursor-pointer hover:border-primary/40" onClick={() => setDetailId(r.id)}>
              <Media photoUrl={r.photo_url} icon="samosa" className="aspect-[3/2] rounded-lg mb-2.5 overflow-hidden flex items-center justify-center" />
              <div className="font-bold text-sm truncate">{pickField(r, 'name', lang)}</div>
              <div className="text-xs text-muted-foreground truncate mb-2">{r.category}</div>
              <StatusPill status={r.status} t={t} />
            </Card>
          ))}
        </div>
      )}

      <Drawer open={!!detailId} onClose={() => setDetailId(null)} title={detail ? pickField(detail, 'name', lang) : ''}>
        {detail && (
          <RecipeDetailView
            recipe={detail}
            items={items}
            lang={lang}
            t={t}
            role={role}
            scaleQty={scaleQty}
            setScaleQty={setScaleQty}
            tab={tab}
            setTab={setTab}
            onEdit={() => openEdit(detail)}
            onDelete={() => removeRecipe(detail.id)}
            onApprove={() => approve(detail.id)}
          />
        )}
      </Drawer>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editingId ? t('edit') : t('newRecipe')} wide>
        {editing && (
          <RecipeForm
            draft={editing}
            setDraft={setEditing}
            items={items}
            langTab={langTab}
            setLangTab={setLangTab}
            t={t}
            onCancel={() => setEditing(null)}
            onSave={saveDraft}
            onDelete={editingId ? () => removeRecipe(editingId) : undefined}
          />
        )}
      </Modal>
    </div>
  )
}

function StatusPill({ status, t }: { status: Recipe['status']; t: (k: any) => string }) {
  const tone = status === 'approved' ? 'good' : status === 'pending' ? 'warn' : 'muted'
  const key = status === 'approved' ? 'approvedSt' : status === 'pending' ? 'pendingSt' : 'draftSt'
  return <Pill tone={tone as any}>{t(key)}</Pill>
}

function scaledQty(base: number, qty: number, target: number) {
  return qty * (target / (base || 1))
}

function printRecipe(recipe: RecipeFull, items: InventoryItem[], lang: Lang, scaleQty: number, t: (k: any) => string) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const rows = recipe.recipe_ingredients.map((ing) => {
    const it = items.find((i) => i.id === ing.item_id)
    const q = scaledQty(recipe.base_yield, ing.qty, scaleQty)
    const name = it ? pickField(it, 'name', lang) : ''
    const prep = pickField(ing, 'prep_state', lang)
    return `<tr><td>${escapeHtml(name)}${prep ? ' — ' + escapeHtml(prep) : ''}</td><td>${fmt1(q)} ${escapeHtml(ing.unit)}</td></tr>`
  }).join('')
  const steps = recipe.recipe_steps.map((s, idx) => {
    const img = s.photo_url ? `<div class="pstepimg"><img src="${escapeHtml(s.photo_url)}"/></div>` : ''
    const warn = pickField(s, 'warning', lang)
    const qc = pickField(s, 'qc', lang)
    return `<div class="pstep"><div class="pstepnum">${idx + 1}</div>${img}<div class="pstepbody">
      <h3>${escapeHtml(pickField(s, 'short', lang))}</h3><p>${escapeHtml(pickField(s, 'detailed', lang))}</p>
      ${warn ? `<p class="pwarn">⚠ ${escapeHtml(warn)}</p>` : ''}
      ${qc ? `<p class="pqc">✓ ${escapeHtml(qc)}</p>` : ''}
      </div></div>`
  }).join('')
  const hero = recipe.photo_url ? `<img src="${escapeHtml(recipe.photo_url)}" class="phero"/>` : ''
  const equip = recipe.recipe_equipment.map((e) => escapeHtml(pickField(e, 'name', lang))).join(' · ')
  const mistakes = pickField(recipe, 'common_mistakes', lang)
  const storage = pickField(recipe, 'storage_instructions', lang)

  const html = `<!doctype html><html dir="${dir}" lang="${lang}"><head><meta charset="utf-8"><title>${escapeHtml(pickField(recipe, 'name', lang))}</title>
  <style>
    body{font-family:'Cairo','Inter',Arial,sans-serif;padding:22px;color:#1c2321;max-width:820px;margin:0 auto;}
    h1{font-size:25px;margin:0 0 4px;} h2{font-size:15px;margin:22px 0 8px;border-bottom:2px solid #c9821f;padding-bottom:5px;}
    .phead{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:3px solid #1c2321;padding-bottom:14px;}
    .phero{width:120px;height:90px;object-fit:cover;border-radius:8px;flex:none;}
    .pmeta{color:#666;font-size:12.5px;margin-top:5px;}
    table{width:100%;border-collapse:collapse;font-size:13px;} td{padding:6px 8px;border-bottom:1px solid #ddd;}
    .pstep{display:flex;gap:12px;margin-bottom:16px;page-break-inside:avoid;}
    .pstepnum{width:28px;height:28px;border-radius:50%;background:#1c2321;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex:none;font-size:13px;}
    .pstepimg img{width:130px;height:96px;object-fit:cover;border-radius:8px;display:block;}
    .pstepbody h3{font-size:14px;margin:0 0 4px;} .pstepbody p{font-size:12.5px;margin:0 0 4px;color:#333;line-height:1.45;}
    .pwarn{color:#a9760b;font-weight:600;} .pqc{color:#3f7d5c;font-weight:600;}
    .pfoot{margin-top:26px;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:8px;}
    @media print{ body{padding:8mm;} }
  </style></head><body>
  <div class="phead"><div><h1>${escapeHtml(pickField(recipe, 'name', lang))}</h1><div class="pmeta">${fmt1(scaleQty)} ${escapeHtml(pickField(recipe, 'yield_unit', lang))} · ${t('prepTime')} ${recipe.prep_time_min} min · ${t('cookTime')} ${recipe.cook_time_min} min</div></div>${hero}</div>
  <h2>${t('ingredients')}</h2><table>${rows}</table>
  ${equip ? `<h2>${t('equipment')}</h2><p>${equip}</p>` : ''}
  <h2>${t('steps')}</h2>${steps}
  ${mistakes ? `<h2>${t('commonMistakes')}</h2><p style="font-size:12.5px;">${escapeHtml(mistakes)}</p>` : ''}
  ${storage ? `<h2>${t('storage')}</h2><p style="font-size:12.5px;">${escapeHtml(storage)}</p>` : ''}
  <div class="pfoot">Del Pasta — ${new Date().toLocaleDateString()}</div>
  </body></html>`

  const win = window.open('', '_blank', 'width=820,height=920')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c])
}

function RecipeDetailView({ recipe, items, lang, t, role, scaleQty, setScaleQty, tab, setTab, onEdit, onDelete, onApprove }: {
  recipe: RecipeFull; items: InventoryItem[]; lang: Lang; t: (k: any) => string; role: string
  scaleQty: number; setScaleQty: (n: number) => void; tab: string; setTab: (s: string) => void
  onEdit: () => void; onDelete: () => void; onApprove: () => void
}) {
  const factor = scaleQty / (recipe.base_yield || 1)
  const ingCost = recipe.recipe_ingredients.reduce((sum, ing) => {
    const it = items.find((i) => i.id === ing.item_id)
    return sum + Number(ing.qty) * Number(it?.cost_per_unit || 0)
  }, 0)
  const cost = ingCost * factor
  const canEdit = canDo(role as any, 'editRecipe')

  return (
    <div>
      <Media photoUrl={recipe.photo_url} icon="samosa" className="aspect-[16/9] rounded-xl mb-4 overflow-hidden flex items-center justify-center" />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs bg-muted rounded-full px-2.5 py-1 font-semibold">{recipe.category}</span>
        <StatusPill status={recipe.status} t={t} />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={() => printRecipe(recipe, items, lang, scaleQty, t)}><Printer size={15} /> {t('print')}</Button>
        {canEdit && <Button onClick={onEdit}><Edit2 size={15} /> {t('edit')}</Button>}
        {canEdit && recipe.status !== 'approved' && <Button onClick={onApprove}><Check size={15} /> {t('approvedSt')}</Button>}
        {canEdit && <Button variant="danger" onClick={onDelete}><Trash2 size={15} /> {t('delete')}</Button>}
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: t('overview') },
          { id: 'cost', label: t('costTab') },
          { id: 'steps', label: t('stepsTab') },
          { id: 'qc', label: t('qcTab') },
        ]}
      />

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <KV label={t('yield')} value={`${recipe.base_yield} ${pickField(recipe, 'yield_unit', lang)}`} />
            <KV label={t('prepTime')} value={`${recipe.prep_time_min} min`} />
            <KV label={t('cookTime')} value={`${recipe.cook_time_min} min`} />
            <KV label={t('shelfLife')} value={pickField(recipe, 'shelf_life', lang) || '—'} />
          </div>
          {recipe.recipe_equipment.length > 0 && (
            <div className="mb-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{t('equipment')}</div>
              <div className="flex flex-wrap gap-1.5">
                {recipe.recipe_equipment.map((e) => <Pill key={e.id} tone="muted">{pickField(e, 'name', lang)}</Pill>)}
              </div>
            </div>
          )}
          {pickField(recipe, 'storage_instructions', lang) && <p className="text-sm">{pickField(recipe, 'storage_instructions', lang)}</p>}
        </div>
      )}

      {tab === 'cost' && (
        <div>
          <div className="flex flex-wrap items-center gap-2 bg-muted rounded-xl p-3 mb-4">
            <span className="text-xs font-bold">{t('scaleTo')}:</span>
            {[50, 100, 250, 500, 1000].map((n) => (
              <button key={n} onClick={() => setScaleQty(n)} className={`px-3 py-1.5 rounded-full border text-xs font-bold ${scaleQty === n ? 'bg-foreground text-background border-foreground' : 'bg-card border-border'}`}>{n}</button>
            ))}
            <input type="number" value={scaleQty} onChange={(e) => setScaleQty(parseFloat(e.target.value) || 0)} className="w-20 rounded-lg border border-input bg-card px-2 py-1 text-xs" />
          </div>
          <table className="w-full text-sm mb-4">
            <thead><tr className="text-xs text-muted-foreground text-start">
              <th className="text-start font-bold pb-1.5">{t('ingredients')}</th><th className="text-start font-bold pb-1.5">{t('quantity')}</th>{canEdit && <th className="text-start font-bold pb-1.5">{t('costPerUnit')}</th>}
            </tr></thead>
            <tbody>
              {recipe.recipe_ingredients.map((ing) => {
                const it = items.find((i) => i.id === ing.item_id)
                const q = scaledQty(recipe.base_yield, ing.qty, scaleQty)
                return (
                  <tr key={ing.id} className="border-t border-border">
                    <td className="py-1.5">{it ? pickField(it, 'name', lang) : ''}{ing.optional && <Pill tone="muted"> {t('optionalIng')}</Pill>}</td>
                    <td className="py-1.5 tabular-nums">{fmt1(q)} {ing.unit}</td>
                    {canEdit && <td className="py-1.5 tabular-nums">{money(it?.cost_per_unit || 0)}</td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
          {canEdit ? (
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3"><div className="text-xs text-muted-foreground mb-1">{t('recipeCost')}</div><b className="text-lg tabular-nums">{money(cost)}</b></Card>
              <Card className="p-3"><div className="text-xs text-muted-foreground mb-1">{t('costPerBatch')}</div><b className="text-lg tabular-nums">{money(cost)}</b></Card>
              <Card className="p-3"><div className="text-xs text-muted-foreground mb-1">{t('costPerPiece')}</div><b className="text-lg tabular-nums">{money(cost / (scaleQty || 1))}</b></Card>
            </div>
          ) : <p className="text-xs text-muted-foreground bg-muted rounded-lg p-3">{t('required')}</p>}
        </div>
      )}

      {tab === 'steps' && (
        <div className="space-y-3">
          {recipe.recipe_steps.length === 0 && <EmptyState text={t('noResults')} />}
          {recipe.recipe_steps.map((s, idx) => (
            <div key={s.id} className="flex gap-3 border border-border rounded-xl p-3.5">
              <div className="w-8 h-8 rounded-full bg-foreground text-background grid place-items-center font-bold text-sm flex-none">{idx + 1}</div>
              <Media photoUrl={s.photo_url} icon={s.icon} className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center flex-none" />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm mb-0.5">{pickField(s, 'short', lang)}</div>
                <div className="text-xs text-muted-foreground mb-1.5">{pickField(s, 'detailed', lang)}</div>
                {pickField(s, 'warning', lang) && <div className="text-xs bg-warning/15 text-warning rounded-lg px-2 py-1 mb-1">⚠ {pickField(s, 'warning', lang)}</div>}
                {pickField(s, 'qc', lang) && <div className="text-xs bg-success/15 text-success rounded-lg px-2 py-1">✓ {pickField(s, 'qc', lang)}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'qc' && (
        <div>
          {recipe.recipe_qc_checkpoints.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {recipe.recipe_qc_checkpoints.map((q) => <Pill key={q.id} tone="good"><Check size={11} /> {pickField(q, 'text', lang)}</Pill>)}
            </div>
          )}
          {pickField(recipe, 'common_mistakes', lang) && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{t('commonMistakes')}</div>
              <p className="text-sm">{pickField(recipe, 'common_mistakes', lang)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function KV({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</div><div className="text-sm font-semibold">{value}</div></div>
}

function RecipeForm({ draft, setDraft, items, langTab, setLangTab, t, onCancel, onSave, onDelete }: {
  draft: Draft; setDraft: (d: Draft) => void; items: InventoryItem[]
  langTab: Lang; setLangTab: (l: Lang) => void; t: (k: any) => string
  onCancel: () => void; onSave: () => void; onDelete?: () => void
}) {
  const upd = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch })
  const updL = (prefix: string, value: string) => setDraft({ ...draft, [`${prefix}_${langTab}`]: value } as Draft)

  const addEquip = () => upd({ equipment: [...draft.equipment, { name_ar: '', name_en: '', name_sw: '', sort_order: 0 }] })
  const rmEquip = (i: number) => upd({ equipment: draft.equipment.filter((_, idx) => idx !== i) })
  const setEquip = (i: number, patch: Partial<RecipeEquipment>) => upd({ equipment: draft.equipment.map((e, idx) => idx === i ? { ...e, ...patch } : e) })

  const addIng = () => upd({ ingredients: [...draft.ingredients, { item_id: null, qty: 0, unit: '', prep_state_ar: '', prep_state_en: '', prep_state_sw: '', optional: false, notes: '', sort_order: 0 }] })
  const rmIng = (i: number) => upd({ ingredients: draft.ingredients.filter((_, idx) => idx !== i) })
  const setIng = (i: number, patch: Partial<RecipeIngredient>) => upd({ ingredients: draft.ingredients.map((ing, idx) => idx === i ? { ...ing, ...patch } : ing) })

  const addStep = () => upd({ steps: [...draft.steps, { step_number: draft.steps.length + 1, icon: 'default', short_ar: '', short_en: '', short_sw: '', detailed_ar: '', detailed_en: '', detailed_sw: '', warning_ar: '', warning_en: '', warning_sw: '', qc_ar: '', qc_en: '', qc_sw: '', photo_url: null }] })
  const rmStep = (i: number) => upd({ steps: draft.steps.filter((_, idx) => idx !== i) })
  const setStep = (i: number, patch: Partial<RecipeStep>) => upd({ steps: draft.steps.map((s, idx) => idx === i ? { ...s, ...patch } : s) })

  const addQc = () => upd({ qc: [...draft.qc, { text_ar: '', text_en: '', text_sw: '', sort_order: 0 }] })
  const rmQc = (i: number) => upd({ qc: draft.qc.filter((_, idx) => idx !== i) })
  const setQc = (i: number, patch: Partial<RecipeQcCheckpoint>) => upd({ qc: draft.qc.map((q, idx) => idx === i ? { ...q, ...patch } : q) })

  return (
    <div>
      <LangTabs active={langTab} onChange={setLangTab} />
      <Field label={`${t('name')} (${langTab})`}>
        <Input value={(draft as any)[`name_${langTab}`] || ''} onChange={(e) => updL('name', e.target.value)} />
      </Field>
      <PhotoUpload folder="recipes" url={draft.photo_url} onChange={(url) => upd({ photo_url: url })} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('category')}><Input value={draft.category || ''} onChange={(e) => upd({ category: e.target.value })} /></Field>
        <Field label={t('recipeStatusLbl')}>
          <Select value={draft.status} onChange={(e) => upd({ status: e.target.value as Recipe['status'] })}>
            <option value="draft">{t('draftSt')}</option>
            <option value="pending">{t('pendingSt')}</option>
            <option value="approved">{t('approvedSt')}</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('yield')}><Input type="number" value={draft.base_yield ?? 100} onChange={(e) => upd({ base_yield: parseFloat(e.target.value) || 0 })} /></Field>
        <Field label={`${t('portions')} (${langTab})`}><Input value={(draft as any)[`yield_unit_${langTab}`] || ''} onChange={(e) => updL('yield_unit', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={`${t('prepTime')} (min)`}><Input type="number" value={draft.prep_time_min ?? 0} onChange={(e) => upd({ prep_time_min: parseInt(e.target.value) || 0 })} /></Field>
        <Field label={`${t('cookTime')} (min)`}><Input type="number" value={draft.cook_time_min ?? 0} onChange={(e) => upd({ cook_time_min: parseInt(e.target.value) || 0 })} /></Field>
      </div>
      <Field label={`${t('shelfLife')} (${langTab})`}><Input value={(draft as any)[`shelf_life_${langTab}`] || ''} onChange={(e) => updL('shelf_life', e.target.value)} /></Field>
      <Field label={`${t('storage')} (${langTab})`}><Textarea value={(draft as any)[`storage_instructions_${langTab}`] || ''} onChange={(e) => updL('storage_instructions', e.target.value)} /></Field>

      <Field label={`${t('equipment')} (${langTab})`}>
        {draft.equipment.map((e, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <Input value={(e as any)[`name_${langTab}`] || ''} onChange={(ev) => setEquip(i, { [`name_${langTab}`]: ev.target.value } as any)} />
            <Button variant="danger" size="sm" onClick={() => rmEquip(i)}><XIcon size={14} /></Button>
          </div>
        ))}
        <Button size="sm" onClick={addEquip}><Plus size={14} /> {t('addEquip')}</Button>
      </Field>

      <Field label={t('ingredients')}>
        {draft.ingredients.map((ing, i) => (
          <Card key={i} className="p-2.5 mb-2">
            <div className="flex gap-2 mb-1.5">
              <Select value={ing.item_id || ''} onChange={(e) => {
                const it = items.find((x) => x.id === e.target.value)
                setIng(i, { item_id: e.target.value || null, unit: it?.unit || ing.unit })
              }}>
                <option value="">—</option>
                {items.map((it) => <option key={it.id} value={it.id}>{it.name_en || it.name_ar}</option>)}
              </Select>
              <Input type="number" step="any" placeholder={t('quantity')} value={ing.qty} onChange={(e) => setIng(i, { qty: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="flex gap-2 mb-1.5">
              <Input placeholder={t('unit')} value={ing.unit} onChange={(e) => setIng(i, { unit: e.target.value })} />
              <Input placeholder={`${t('prepState')} (${langTab})`} value={(ing as any)[`prep_state_${langTab}`] || ''} onChange={(e) => setIng(i, { [`prep_state_${langTab}`]: e.target.value } as any)} />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={ing.optional} onChange={(e) => setIng(i, { optional: e.target.checked })} /> {t('optionalIng')}</label>
              <Button variant="danger" size="sm" onClick={() => rmIng(i)}><Trash2 size={14} /> {t('removeRow')}</Button>
            </div>
          </Card>
        ))}
        <Button size="sm" onClick={addIng}><Plus size={14} /> {t('addIngredient')}</Button>
      </Field>

      <Field label={`${t('steps')} (${langTab})`}>
        {draft.steps.map((s, i) => (
          <Card key={i} className="p-2.5 mb-2">
            <div className="flex gap-2 mb-1.5">
              <Input placeholder={t('stepShort')} value={(s as any)[`short_${langTab}`] || ''} onChange={(e) => setStep(i, { [`short_${langTab}`]: e.target.value } as any)} />
              <Select value={s.icon} onChange={(e) => setStep(i, { icon: e.target.value })} className="w-28">
                {ICONS.map((k) => <option key={k} value={k}>{k}</option>)}
              </Select>
            </div>
            <StepPhoto url={s.photo_url} onChange={(url) => setStep(i, { photo_url: url })} />
            <Textarea placeholder={t('stepDetail')} value={(s as any)[`detailed_${langTab}`] || ''} onChange={(e) => setStep(i, { [`detailed_${langTab}`]: e.target.value } as any)} className="mb-1.5" />
            <Input placeholder={t('warning')} value={(s as any)[`warning_${langTab}`] || ''} onChange={(e) => setStep(i, { [`warning_${langTab}`]: e.target.value } as any)} className="mb-1.5" />
            <Input placeholder={t('qualityCheck')} value={(s as any)[`qc_${langTab}`] || ''} onChange={(e) => setStep(i, { [`qc_${langTab}`]: e.target.value } as any)} className="mb-1.5" />
            <div className="text-end"><Button variant="danger" size="sm" onClick={() => rmStep(i)}><Trash2 size={14} /> {t('removeRow')}</Button></div>
          </Card>
        ))}
        <Button size="sm" onClick={addStep}><Plus size={14} /> {t('addStep')}</Button>
      </Field>

      <Field label={`${t('qcCheckpoints')} (${langTab})`}>
        {draft.qc.map((q, i) => (
          <div key={i} className="flex gap-2 mb-1.5">
            <Input value={(q as any)[`text_${langTab}`] || ''} onChange={(e) => setQc(i, { [`text_${langTab}`]: e.target.value } as any)} />
            <Button variant="danger" size="sm" onClick={() => rmQc(i)}><XIcon size={14} /></Button>
          </div>
        ))}
        <Button size="sm" onClick={addQc}><Plus size={14} /> {t('add')}</Button>
      </Field>
      <Field label={`${t('commonMistakes')} (${langTab})`}>
        <Textarea value={(draft as any)[`common_mistakes_${langTab}`] || ''} onChange={(e) => updL('common_mistakes', e.target.value)} />
      </Field>

      <div className="flex justify-end gap-2 mt-4">
        {onDelete && <Button variant="danger" onClick={onDelete}><Trash2 size={15} /> {t('delete')}</Button>}
        <Button onClick={onCancel}>{t('cancel')}</Button>
        <Button variant="primary" onClick={onSave}><Check size={15} /> {t('save')}</Button>
      </div>
    </div>
  )
}

function StepPhoto({ url, onChange }: { url: string | null; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false)
  if (!isSupabaseConfigured()) return null
  const handle = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try { onChange(await uploadPhoto(file, 'recipe-steps')) } finally { setBusy(false) }
  }
  return (
    <div className="flex items-center gap-2 mb-1.5">
      {url && <img src={url} className="w-9 h-9 object-cover rounded-md border border-border" />}
      <input type="file" accept="image/*" onChange={(e) => handle(e.target.files?.[0])} className="text-xs max-w-[200px]" disabled={busy} />
    </div>
  )
}
