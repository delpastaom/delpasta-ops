import { type ButtonHTMLAttributes, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { X } from 'lucide-react'

function cn(...xs: (string | false | undefined | null)[]) {
  return xs.filter(Boolean).join(' ')
}

export function Button({ className, variant = 'default', size = 'md', ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'ghost' | 'danger'; size?: 'md' | 'sm' }) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg border font-semibold whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const sizes = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
  const variants = {
    default: 'bg-card border-border text-foreground hover:border-primary/50',
    primary: 'bg-primary border-primary text-primary-foreground hover:brightness-95',
    ghost: 'bg-transparent border-transparent hover:bg-muted',
    danger: 'bg-transparent border-transparent text-destructive hover:bg-destructive/10',
  }[variant]
  return <button className={cn(base, sizes, variants, className)} {...props} />
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('bg-card border border-border rounded-xl shadow-sm', className)} {...props} />
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40 min-h-[70px]', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40', className)} {...props}>{children}</select>
}

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('block text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5', className)} {...props} />
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="mb-3.5"><Label>{label}</Label>{children}</div>
}

export function Pill({ tone = 'muted', children }: { tone?: 'good' | 'warn' | 'critical' | 'info' | 'muted'; children: ReactNode }) {
  const tones = {
    good: 'bg-success/15 text-success',
    warn: 'bg-warning/15 text-warning',
    critical: 'bg-destructive/15 text-destructive',
    info: 'bg-primary/15 text-accent',
    muted: 'bg-muted text-muted-foreground',
  }[tone]
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold', tones)}>{children}</span>
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={cn('bg-background rounded-2xl shadow-2xl w-full max-h-[88vh] overflow-y-auto', wide ? 'max-w-2xl' : 'max-w-lg')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur flex items-center justify-between px-5 py-4 border-b border-border z-10">
          <h2 className="font-bold text-base">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-border grid place-items-center hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="bg-background w-full max-w-xl h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-background/95 backdrop-blur flex items-center justify-between px-5 py-4 border-b border-border z-10">
          <h2 className="font-bold text-base">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-border grid place-items-center hover:bg-muted"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px',
            active === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="py-10 text-center text-muted-foreground text-sm">
      {icon && <div className="mb-2 flex justify-center opacity-50">{icon}</div>}
      {text}
    </div>
  )
}

export { cn }
