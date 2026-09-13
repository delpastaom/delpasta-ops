import type { Lang } from '@/lib/i18n'

const LABELS: Record<Lang, string> = { en: 'English', ar: 'العربية', sw: 'Kiswahili' }

export default function LangTabs({ active, onChange }: { active: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex gap-1.5 mb-3">
      {(['en', 'ar', 'sw'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-3 py-1 rounded-md border text-xs font-bold ${active === l ? 'bg-foreground text-background border-foreground' : 'bg-card border-border'}`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
