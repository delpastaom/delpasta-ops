import { pickField, type Lang, type TKey } from './i18n'
import type { InventoryItem, BuffetEventFull, AssetItem } from './types'

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}

const SHEET_CSS = `
  body{font-family:'Cairo','Inter',Arial,sans-serif;padding:14mm;color:#1c2321;}
  h1{font-size:20px;margin:0 0 2px;}
  .meta{color:#666;font-size:12px;margin-bottom:14px;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th,td{border:1px solid #999;padding:6px 5px;text-align:center;}
  th.name,td.name{text-align:start;min-width:130px;}
  th.unit,td.unit{min-width:50px;}
  th.cell{min-width:52px;height:26px;font-weight:400;color:#888;font-size:10.5px;}
  td.cell{height:30px;}
  tr.signrow td{font-weight:600;font-size:11px;color:#555;}
  .pfoot{margin-top:12px;font-size:10.5px;color:#999;}
  @page{ size: landscape; margin: 10mm; }
`

export function printStockCountSheet(
  items: InventoryItem[],
  categoryName: string,
  lang: Lang,
  t: (k: TKey) => string,
  dateColumns = 8,
) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const dateHeaders = Array.from({ length: dateColumns }, () => `<th class="cell"></th>`).join('')
  const rows = items
    .map(
      (it) =>
        `<tr><td class="name">${escapeHtml(pickField(it, 'name', lang))}</td><td class="unit">${escapeHtml(it.unit)}</td>${Array.from(
          { length: dateColumns },
          () => `<td class="cell"></td>`,
        ).join('')}</tr>`,
    )
    .join('')
  const signCells = Array.from({ length: dateColumns }, () => `<td class="cell"></td>`).join('')

  const html = `<!doctype html><html dir="${dir}" lang="${lang}"><head><meta charset="utf-8"><title>${escapeHtml(categoryName)}</title>
  <style>${SHEET_CSS}</style></head><body>
  <h1>${escapeHtml(categoryName)}</h1>
  <div class="meta">${escapeHtml(t('countSheetHint'))}</div>
  <table>
    <thead><tr>
      <th class="name">${escapeHtml(t('item'))}</th>
      <th class="unit">${escapeHtml(t('unit'))}</th>
      ${dateHeaders}
    </tr></thead>
    <tbody>
      ${rows}
      <tr class="signrow"><td class="name">${escapeHtml(t('checkedBy'))}</td><td class="unit"></td>${signCells}</tr>
    </tbody>
  </table>
  <div class="pfoot">Del Pasta — ${new Date().toLocaleDateString()}</div>
  </body></html>`

  const win = window.open('', '_blank', 'width=1000,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 250)
}

const EVENT_CSS = `
  body{font-family:'Cairo','Inter',Arial,sans-serif;padding:14mm;color:#1c2321;max-width:900px;margin:0 auto;}
  h1{font-size:24px;margin:0 0 4px;}
  h2{font-size:14px;margin:20px 0 8px;border-bottom:2px solid #c9821f;padding-bottom:5px;}
  .phead{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1c2321;padding-bottom:12px;}
  .meta{font-size:12.5px;color:#555;line-height:1.7;}
  .guestbadge{background:#1c2321;color:#fff;border-radius:10px;padding:10px 18px;text-align:center;}
  .guestbadge b{display:block;font-size:26px;}
  .guestbadge span{font-size:10.5px;opacity:.8;}
  table{width:100%;border-collapse:collapse;font-size:12.5px;}
  th,td{border:1px solid #ccc;padding:6px 8px;text-align:start;}
  th{background:#f2ede3;font-size:11px;}
  td.num{text-align:center;font-weight:700;}
  .notesbox{min-height:20px;color:#666;}
  .pfoot{margin-top:20px;font-size:10.5px;color:#999;border-top:1px solid #ddd;padding-top:8px;}
  @media print{ body{padding:8mm;} }
`

export function printEventSheet(
  event: BuffetEventFull,
  assets: AssetItem[],
  lang: Lang,
  t: (k: TKey) => string,
) {
  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  const dishRows = event.buffet_event_dishes
    .map(
      (d) =>
        `<tr><td>${escapeHtml(d.category)}</td><td>${escapeHtml(d.dish_name)}</td><td class="num">${d.plate_count}</td><td class="notesbox">${escapeHtml(d.notes)}</td></tr>`,
    )
    .join('')

  const equipRows = event.buffet_event_equipment
    .map((e) => {
      const asset = assets.find((a) => a.id === e.asset_item_id)
      const name = asset ? pickField(asset, 'name', lang) : ''
      return `<tr><td>${escapeHtml(name)}</td><td class="num">${e.qty}</td></tr>`
    })
    .join('')

  const html = `<!doctype html><html dir="${dir}" lang="${lang}"><head><meta charset="utf-8"><title>${escapeHtml(event.name)}</title>
  <style>${EVENT_CSS}</style></head><body>
  <div class="phead">
    <div><h1>${escapeHtml(event.name)}</h1>
      <div class="meta">${event.event_date ? escapeHtml(event.event_date) : ''}${event.notes ? '<br>' + escapeHtml(event.notes) : ''}</div>
    </div>
    <div class="guestbadge"><b>${event.guest_count}</b><span>${escapeHtml(t('guestCount'))}</span></div>
  </div>

  <h2>${escapeHtml(t('dishes'))}</h2>
  <table><thead><tr><th>${escapeHtml(t('category'))}</th><th>${escapeHtml(t('dishName'))}</th><th>${escapeHtml(t('plateCount'))}</th><th>${escapeHtml(t('notes'))}</th></tr></thead>
  <tbody>${dishRows || `<tr><td colspan="4">—</td></tr>`}</tbody></table>

  <h2>${escapeHtml(t('nav_assets'))}</h2>
  <table><thead><tr><th>${escapeHtml(t('item'))}</th><th>${escapeHtml(t('quantity'))}</th></tr></thead>
  <tbody>${equipRows || `<tr><td colspan="2">—</td></tr>`}</tbody></table>

  ${event.decoration_notes ? `<h2>${escapeHtml(t('decoration'))}</h2><p>${escapeHtml(event.decoration_notes)}</p>` : ''}
  <div class="pfoot">Del Pasta — ${new Date().toLocaleDateString()}</div>
  </body></html>`

  const win = window.open('', '_blank', 'width=1000,height=800')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 250)
}
