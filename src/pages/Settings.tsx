import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useI18n, pickField, type Lang } from '@/lib/i18n'
import { useRole } from '@/lib/role'
import { canDo, type Category } from '@/lib/types'
import { listCategories, addCategory, verifyAdminPin, setAdminPin } from '@/lib/db'
import { Card, Button, Modal, Field, Input, Select, EmptyState } from '@/components/ui'
import LangTabs from '@/components/LangTabs'

export default function Settings() {
  const { t, lang } = useI18n()
  const { role, userName, setUserName } = useRole()
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    listCategories().then(setCats).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

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

      <Modal open={adding} onClose={() => setAdding(false)} title={t('add')}>
        <CategoryForm onDone={() => { setAdding(false); load() }} onCancel={() => setAdding(false)} t={t} />
      </Modal>
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
