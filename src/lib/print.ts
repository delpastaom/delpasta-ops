import { pickField, type Lang, type TKey } from './i18n'
import type { InventoryItem } from './types'

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
