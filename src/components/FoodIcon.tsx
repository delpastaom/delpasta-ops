const PATHS: Record<string, string> = {
  cheese: '<path d="M6 40 50 14l8 26-6 8H10Z" fill="var(--c1)"/><circle cx="30" cy="34" r="2.6" fill="var(--c2)"/><circle cx="40" cy="30" r="2" fill="var(--c2)"/><circle cx="35" cy="41" r="1.8" fill="var(--c2)"/>',
  onion: '<path d="M32 10c9 6 13 15 13 24 0 8-6 15-13 15s-13-7-13-15c0-9 4-18 13-24Z" fill="var(--c1)"/><path d="M32 10v39M23 18c3 7 3 22 0 30M41 18c-3 7-3 22 0 30" stroke="var(--c2)" stroke-width="1.4" fill="none"/>',
  pastry: '<path d="M10 46 32 12l22 34Z" fill="var(--c1)"/><path d="M16 42 32 18l16 24" stroke="var(--c2)" stroke-width="1.6" fill="none"/>',
  samosa: '<path d="M10 44 30 14l24 16-10 18Z" fill="var(--c1)"/><path d="M16 40l16-22 15 10" stroke="var(--c2)" stroke-width="1.6" fill="none"/>',
  oil: '<path d="M26 8h12v8l6 6v28a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V22l6-6Z" fill="var(--c1)"/><rect x="27" y="6" width="10" height="5" fill="var(--c2)"/>',
  spice: '<rect x="16" y="20" width="32" height="30" rx="4" fill="var(--c1)"/><rect x="22" y="10" width="20" height="12" rx="2" fill="var(--c2)"/><circle cx="26" cy="34" r="1.6" fill="var(--c2)"/><circle cx="34" cy="40" r="1.6" fill="var(--c2)"/><circle cx="40" cy="30" r="1.6" fill="var(--c2)"/>',
  starch: '<path d="M18 16h28l4 8-6 26H20l-6-26Z" fill="var(--c1)"/><path d="M22 16v-4h20v4" stroke="var(--c2)" stroke-width="1.6" fill="none"/>',
  packaging: '<rect x="10" y="22" width="44" height="28" rx="3" fill="var(--c1)"/><path d="M10 30h44M32 22v28" stroke="var(--c2)" stroke-width="1.6"/>',
  dairy: '<path d="M24 8h16v9l5 6v25a4 4 0 0 1-4 4H23a4 4 0 0 1-4-4V23l5-6Z" fill="var(--c1)"/><rect x="24" y="6" width="16" height="5" fill="var(--c2)"/>',
  meat: '<path d="M14 40c-4-5-4-15 3-20 7-6 17-7 24-2 6 4 8 12 3 18-5 7-15 10-22 11-4 6-10 7-14 5-4-2-1-3 1-4 2-1 4-3 5-8Z" fill="var(--c1)"/>',
  veg: '<path d="M12 46c17 3 29-8 29-27C22 12 12 26 12 46Z" fill="var(--c1)"/><path d="M12 46c6-9 13-16 20-22" stroke="var(--c2)" stroke-width="1.6" fill="none"/>',
  clean: '<path d="m18 32 18-18" stroke="var(--c2)" stroke-width="3"/><path d="M28 12 46 30 22 54 12 44Z" fill="var(--c1)"/>',
  frozen: '<path d="M32 8v48M12 18l40 28M52 18 12 46" stroke="var(--c1)" stroke-width="3.5"/>',
  tray: '<path d="M8 36h48l-7 14H15Z" fill="var(--c1)"/><path d="M16 36V16a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v20" stroke="var(--c2)" stroke-width="1.8" fill="none"/>',
  default: '<rect x="12" y="12" width="40" height="40" rx="8" fill="var(--c1)"/><circle cx="32" cy="32" r="9" fill="var(--c2)"/>',
}

// [background tint, shape fill, accent] per icon key — warm, food-specific palette
const TINTS: Record<string, [string, string]> = {
  cheese: ['#fbe8c6', '#c1811a'],
  onion: ['#f7e0da', '#b8593c'],
  pastry: ['#f6ecd2', '#a9760b'],
  samosa: ['#f6e3c2', '#a86414'],
  oil: ['#fdf1cf', '#c99a1f'],
  spice: ['#f6dcc2', '#a8531a'],
  starch: ['#f1ecdd', '#8a7d5c'],
  packaging: ['#ece5d6', '#8a7d5c'],
  dairy: ['#eef1f6', '#5b7290'],
  meat: ['#f6dcd6', '#a83f2c'],
  veg: ['#e4efd8', '#4c7a2c'],
  clean: ['#dceef0', '#2c7a82'],
  frozen: ['#dcedf6', '#2c6a8f'],
  tray: ['#f0e6d2', '#8a6a2f'],
  default: ['#ece5d6', '#7a7264'],
}

export function iconTint(key: string) {
  return TINTS[key] || TINTS.default
}

export default function FoodIcon({ icon, className }: { icon: string; className?: string }) {
  const [bg, fg] = iconTint(icon)
  const d = PATHS[icon] || PATHS.default
  return (
    <div
      className={className}
      style={{ background: bg, ['--c1' as any]: fg, ['--c2' as any]: '#fff' }}
    >
      <svg viewBox="0 0 64 64" fill="none" style={{ width: '52%', height: '52%' }} dangerouslySetInnerHTML={{ __html: d }} />
    </div>
  )
}
