import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useI18n, pickField, type Lang, type TKey } from '@/lib/i18n'
import { useRole } from '@/lib/role'
import { canDo, type Category, type MenuTemplate, type MenuTemplateFull, type MenuTemplateDish, type Recipe } from '@/lib/types'
import {
  listCategories, addCategory, verifyAdminPin, setAdminPin,
  listMenuTemplates, getMenuTemplate, saveMenuTemplate, deleteMenuTemplate, listRecipes,
  type MenuTemplateSaveInput,
} from '@/lib/db'
import { Card, Button, Modal, Field, Input, Select, EmptyState } from '@/components/ui'
import LangTabs from '@/components/LangTabs'

export default function Settings() {
  const { t, lang } = useI18n()
  const { role, userName, setUserName } = useRole()
  const [cats, setCats] = useState<Category[]>([])
  const [templates, setTemplates] = useState<MenuTemplate[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [tplEditing, setTplEditing] = useState<{ id: string | null; draft: TplDraft } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([listCategories(), listMenuTemplates(), listRecipes()])
      .then(([c, m, r]) => { setCats(c); setTemplates(m); setRecipes(r) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  const openTemplate = async (id?: string) => {
    if (!id) { setTplEditing({ id: null, draft: blankTplDraft() }); return }
    const full = await getMenuTemplate(id)
    if (full) setTplEditing({ id, draft: draftFromTemplate(full) })
  }
  const removeTemplate = async (id: string) => {
    if (!confirm(t('delete') + '?')) return
    await deleteMenuTemplate(id)
    load()
  }

  if (loading) return <div className="py-16 text-center text-muted-foreground text-sm">{t('loading')}</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-sm mb-2">{t('user')}</h2>
        <Card className="p-4 max-w-sm">
          <Field label={t('name')}>
            <Input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder={t('role') + ': ' + t(role)} />
          </Field>
        </Card>
      </div>

      {role === 'admin' && (
        <div>
          <h2 className="font-bold text-sm mb-2">{t('changePin')}</h2>
          <Card className="p-4 max-w-sm">
            <PinChangeForm t={t} />
          </Card>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-sm">{t('category')}</h2>
          {canDo(role, 'manageCategories') && <Button size="sm" onClick={() => setAdding(true)}><Plus size={14} /> {t('add')}</Button>}
        </div>
        <Card className="divide-y divide-border">
          {cats.length === 0 ? <EmptyState text={t('noResults')} /> : cats.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-semibold">{pickField(c, 'name', lang)}</span>
              <span className="text-xs text-muted-foreground">{c.id} · {c.kind}</span>
            </div>
          ))}
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-sm">{t('menuTemplates')}</h2>
          {canDo(role, 'manageMenuTemplates') && <Button size="sm" onClick={() => openTemplate()}><Plus size={14} /> {t('newTemplate')}</Button>}
        </div>
        <Card className="divide-y divide-border">
          {templates.length === 0 ? <EmptyState text={t('noTemplatesYet')} /> : templates.map((tpl) => (
            <div key={tpl.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-semibold">{pickField(tpl, 'name', lang)}</span>
              {canDo(role, 'manageMenuTemplates') && (
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => openTemplate(tpl.id)}><Edit2 size={13} /></Button>
                  <Button size="sm" variant="danger" onClick={() => removeTemplate(tpl.id)}><Trash2 size={13} /></Button>
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title={t('add')}>
        <CategoryForm onDone={() => { setAdding(false); load() }} onCancel={() => setAdding(false)} t={t} />
      </Modal>

      <Modal open={!!tplEditing} onClose={() => setTplEditing(null)} title={tplEditing?.id ? t('edit') : t('newTemplate')} wide>
        {tplEditing && (
          <MenuTemplateForm
            initial={tplEditing.draft}
            isNew={!tplEditing.id}
            templateId={tplEditing.id}
            recipes={recipes}
            t={t}
            lang={lang}
            onCancel={() => setTplEditing(null)}
            onSaved={() => { setTplEditing(null); load() }}
          />
        )}
      </Modal>
    </div>
  )
}

type TplDraft = { name_ar: string; name_en: string; name_sw: string; dishes: Omit<MenuTemplateDish, 'id' | 'template_id'>[] }
function blankTplDraft(): TplDraft { return { name_ar: '', name_en: '', name_sw: '', dishes: [] } }
function draftFromTemplate(tpl: MenuTemplateFull): TplDraft {
  return {
    name_ar: tpl.name_ar, name_en: tpl.name_en, name_sw: tpl.name_sw,
    dishes: tpl.menu_template_dishes.map(({ recipe_id, dish_name, category, plate_count }) => ({ recipe_id, dish_name, category, plate_count, sort_order: 0 })),
  }
}
function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || crypto.randomUUID().slice(0, 8)
}

function MenuTemplateForm({ initial, isNew, templateId, recipes, t, lang, onCancel, onSaved }: {
  initial: TplDraft; isNew: boolean; templateId: string | null; recipes: Recipe[]
  t: (k: TKey) => string; lang: Lang; onCancel: () => void; onSaved: () => void
}) {
  const [langTab, setLangTab] = useState<Lang>('en')
  const [draft, setDraft] = useState<TplDraft>(initial)
  const [saving, setSaving] = useState(false)
  const upd = (patch: Partial<TplDraft>) => setDraft({ ...draft, ...patch })

  const addDish = () => upd({ dishes: [...draft.dishes, { recipe_id: null, dish_name: '', category: '', plate_count: 0, sort_order: 0 }] })
  const rmDish = (i: number) => upd({ dishes: draft.dishes.filter((_, idx) => idx !== i) })
  const setDish = (i: number, patch: Partial<MenuTemplateDish>) => upd({ dishes: draft.dishes.map((d, idx) => idx === i ? { ...d, ...patch } : d) })

  const submit = async () => {
    const id = templateId || slugify(draft.name_en || draft.name_ar || draft.name_sw)
    setSaving(true)
    try {
      await saveMenuTemplate({ id, name_ar: draft.name_ar, name_en: draft.name_en, name_sw: draft.name_sw, dishes: draft.dishes } as MenuTemplateSaveInput, isNew)
      onSaved()
    } finally { setSaving(false) }
  }

  return (
    <div>
      <LangTabs active={langTab} onChange={setLangTab} />
      <Field label={`${t('templateName')} (${langTab})`}>
        <Input value={(draft as any)[`name_${langTab}`]} onChange={(e) => upd({ [`name_${langTab}`]: e.target.value } as any)} />
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
            <div className="flex gap-2">
              <Input placeholder={t('dishCategory')} value={d.category} onChange={(e) => setDish(i, { category: e.target.value })} />
              <Input type="number" placeholder={t('plateCount')} value={d.plate_count} onChange={(e) => setDish(i, { plate_count: parseFloat(e.target.value) || 0 })} />
              <Button variant="danger" size="sm" onClick={() => rmDish(i)}><Trash2 size={14} /></Button>
            </div>
          </Card>
        ))}
        <Button size="sm" onClick={addDish}><Plus size={14} /> {t('addDish')}</Button>
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onCancel}>{t('cancel')}</Button>
        <Button variant="primary" disabled={saving} onClick={submit}>{t('save')}</Button>
      </div>
    </div>
  )
}

function PinChangeForm({ t }: { t: (k: any) => string }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const submit = async () => {
    setMsg(null)
    if (!next.trim()) return
    setSaving(true)
    try {
      const ok = await verifyAdminPin(current)
      if (!ok) { setMsg({ ok: false, text: t('wrongPin') }); return }
      await setAdminPin(next.trim())
      setCurrent(''); setNext('')
      setMsg({ ok: true, text: t('pinChanged') })
    } catch {
      setMsg({ ok: false, text: t('wrongPin') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Field label={t('currentPin')}><Input type="password" inputMode="numeric" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
      <Field label={t('newPin')}><Input type="password" inputMode="numeric" value={next} onChange={(e) => setNext(e.target.value)} /></Field>
      {msg && <p className={`text-xs mb-2 ${msg.ok ? 'text-success' : 'text-destructive'}`}>{msg.text}</p>}
      <Button variant="primary" size="sm" disabled={saving} onClick={submit}>{t('save')}</Button>
    </div>
  )
}

function CategoryForm({ onDone, onCancel, t }: { onDone: () => void; onCancel: () => void; t: (k: any) => string }) {
  const [langTab, setLangTab] = useState<Lang>('en')
  const [name, setName] = useState({ ar: '', en: '', sw: '' })
  const [kind, setKind] = useState<'consumable' | 'asset'>('consumable')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    const id = (name.en || name.ar || name.sw).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (!id) return
    setSaving(true)
    try {
      await addCategory({ id, name_ar: name.ar, name_en: name.en, name_sw: name.sw, kind })
      onDone()
    } finally { setSaving(false) }
  }

  return (
    <div>
      <LangTabs active={langTab} onChange={setLangTab} />
      <Field label={`${t('name')} (${langTab})`}>
        <Input value={name[langTab]} onChange={(e) => setName({ ...name, [langTab]: e.target.value })} />
      </Field>
      <Field label={t('type')}>
        <Select value={kind} onChange={(e) => setKind(e.target.value as any)}>
          <option value="consumable">{t('consumable')}</option>
          <option value="asset">{t('asset')}</option>
        </Select>
      </Field>
      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onCancel}>{t('cancel')}</Button>
        <Button variant="primary" disabled={saving} onClick={submit}>{t('save')}</Button>
      </div>
    </div>
  )
}
