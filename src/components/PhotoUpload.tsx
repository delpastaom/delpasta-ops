import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { uploadPhoto } from '@/lib/db'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'

export default function PhotoUpload({ folder, url, onChange }: { folder: string; url: string | null | undefined; onChange: (url: string) => void }) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  if (!isSupabaseConfigured()) return null

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const publicUrl = await uploadPhoto(file, folder)
      onChange(publicUrl)
    } catch {
      /* ignore — surfaced visually by nothing changing */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-3.5">
      <label className="block text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{t('photo')}</label>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-lg border border-border bg-muted overflow-hidden grid place-items-center flex-none">
          {busy ? <Loader2 size={18} className="animate-spin text-muted-foreground" /> :
            url ? <img src={url} className="w-full h-full object-cover" /> : <Camera size={18} className="text-muted-foreground" />}
        </div>
        <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} className="text-xs max-w-[220px]" />
      </div>
    </div>
  )
}
