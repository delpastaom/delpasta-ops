import { getSupabase } from './supabase'
import type {
  Category, InventoryItem, InventoryTransaction, Recipe, RecipeFull,
  RecipeEquipment, RecipeIngredient, RecipeStep, RecipeQcCheckpoint, TxnType,
} from './types'

function sb() {
  const c = getSupabase()
  if (!c) throw new Error('Supabase is not configured')
  return c
}

// ============================= Categories =============================
export async function listCategories(): Promise<Category[]> {
  const { data, error } = await sb().from('categories').select('*').order('sort_order')
  if (error) throw error
  return data as Category[]
}
export async function addCategory(cat: Omit<Category, 'sort_order'> & { sort_order?: number }) {
  const { error } = await sb().from('categories').insert({ ...cat, sort_order: cat.sort_order ?? 999 })
  if (error) throw error
}

// ============================= Inventory =============================
export async function listInventory(): Promise<InventoryItem[]> {
  const { data, error } = await sb().from('inventory_items').select('*').order('name_en')
  if (error) throw error
  return data as InventoryItem[]
}
export async function addInventoryItem(item: Partial<InventoryItem>) {
  const { data, error } = await sb().from('inventory_items').insert(item).select().single()
  if (error) throw error
  return data as InventoryItem
}
export async function updateInventoryItem(id: string, item: Partial<InventoryItem>) {
  const { error } = await sb().from('inventory_items').update(item).eq('id', id)
  if (error) throw error
}
export async function deleteInventoryItem(id: string) {
  const { error } = await sb().from('inventory_items').delete().eq('id', id)
  if (error) throw error
}

// ============================= Transactions =============================
export async function listTransactions(itemId?: string): Promise<InventoryTransaction[]> {
  let q = sb().from('inventory_transactions').select('*').order('datetime', { ascending: false })
  if (itemId) q = q.eq('item_id', itemId)
  const { data, error } = await q
  if (error) throw error
  return data as InventoryTransaction[]
}
export async function recordTransaction(item: InventoryItem, type: TxnType, qty: number, userName: string, reason: string, notes: string) {
  const delta = (type === 'in' || type === 'returned') ? qty : -qty
  const newQty = Math.max(0, Number(item.qty) + delta)
  const { error: e1 } = await sb().from('inventory_items').update({ qty: newQty }).eq('id', item.id)
  if (e1) throw e1
  const { error: e2 } = await sb().from('inventory_transactions').insert({
    item_id: item.id, type, qty, unit: item.unit, user_name: userName, reason, notes,
  })
  if (e2) throw e2
}

// ============================= Recipes =============================
const RECIPE_SELECT = '*, recipe_equipment(*), recipe_ingredients(*), recipe_steps(*), recipe_qc_checkpoints(*)'

export async function listRecipes(): Promise<Recipe[]> {
  const { data, error } = await sb().from('recipes').select('*').order('name_en')
  if (error) throw error
  return data as Recipe[]
}
export async function getRecipe(id: string): Promise<RecipeFull | null> {
  const { data, error } = await sb().from('recipes').select(RECIPE_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const r = data as unknown as RecipeFull
  r.recipe_equipment.sort((a, b) => a.sort_order - b.sort_order)
  r.recipe_ingredients.sort((a, b) => a.sort_order - b.sort_order)
  r.recipe_steps.sort((a, b) => a.step_number - b.step_number)
  r.recipe_qc_checkpoints.sort((a, b) => a.sort_order - b.sort_order)
  return r
}

export type RecipeSaveInput = Partial<Recipe> & {
  id: string
  equipment: Omit<RecipeEquipment, 'id' | 'recipe_id'>[]
  ingredients: Omit<RecipeIngredient, 'id' | 'recipe_id'>[]
  steps: Omit<RecipeStep, 'id' | 'recipe_id'>[]
  qc: Omit<RecipeQcCheckpoint, 'id' | 'recipe_id'>[]
}

export async function saveRecipe(input: RecipeSaveInput, isNew: boolean) {
  const { equipment, ingredients, steps, qc, ...recipeFields } = input
  const client = sb()

  if (isNew) {
    const { error } = await client.from('recipes').insert({ ...recipeFields, updated_at: new Date().toISOString() })
    if (error) throw error
  } else {
    const { error } = await client.from('recipes').update({ ...recipeFields, updated_at: new Date().toISOString() }).eq('id', input.id)
    if (error) throw error
  }

  await client.from('recipe_equipment').delete().eq('recipe_id', input.id)
  if (equipment.length) {
    const { error } = await client.from('recipe_equipment').insert(equipment.map((e, i) => ({ ...e, recipe_id: input.id, sort_order: i })))
    if (error) throw error
  }

  await client.from('recipe_ingredients').delete().eq('recipe_id', input.id)
  if (ingredients.length) {
    const { error } = await client.from('recipe_ingredients').insert(ingredients.map((ing, i) => ({ ...ing, recipe_id: input.id, sort_order: i })))
    if (error) throw error
  }

  await client.from('recipe_steps').delete().eq('recipe_id', input.id)
  if (steps.length) {
    const { error } = await client.from('recipe_steps').insert(steps.map((s, i) => ({ ...s, recipe_id: input.id, step_number: i + 1 })))
    if (error) throw error
  }

  await client.from('recipe_qc_checkpoints').delete().eq('recipe_id', input.id)
  if (qc.length) {
    const { error } = await client.from('recipe_qc_checkpoints').insert(qc.map((q, i) => ({ ...q, recipe_id: input.id, sort_order: i })))
    if (error) throw error
  }
}

export async function deleteRecipe(id: string) {
  const { error } = await sb().from('recipes').delete().eq('id', id)
  if (error) throw error
}

export async function setRecipeStatus(id: string, status: Recipe['status']) {
  const { error } = await sb().from('recipes').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

// ============================= Photos =============================
export async function uploadPhoto(file: File, folder: string): Promise<string> {
  const client = sb()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await client.storage.from('photos').upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = client.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}

// ============================= Audit =============================
export async function logAudit(userName: string, role: string, action: string, target: string, details = '') {
  const client = getSupabase()
  if (!client) return
  await client.from('audit_log').insert({ user_name: userName, role, action, target, details }).then(() => {}, () => {})
}
