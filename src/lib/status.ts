import type { InventoryItem } from './types'

export type InvStatus = 'ok' | 'low' | 'critical' | 'out'

export function invStatus(item: InventoryItem): InvStatus {
  const q = Number(item.qty)
  const min = Number(item.min_level)
  if (q <= 0) return 'out'
  if (min > 0 && q < min * 0.5) return 'critical'
  if (min > 0 && q < min) return 'low'
  return 'ok'
}

export function daysUntil(dateStr: string | null): number {
  if (!dateStr) return Infinity
  const d = new Date(dateStr + 'T00:00:00').getTime()
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((d - now.getTime()) / 86400000)
}

export function money(n: number): string {
  return 'OMR ' + (Math.round(Number(n) * 1000) / 1000).toFixed(3)
}

export function fmt1(n: number): string {
  return (Math.round(Number(n) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })
}
