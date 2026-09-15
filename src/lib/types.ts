export type Category = {
  id: string
  name_ar: string; name_en: string; name_sw: string
  kind: 'consumable' | 'asset'
  sort_order: number
}

export type InventoryItem = {
  id: string
  name_ar: string; name_en: string; name_sw: string
  category_id: string | null
  subcategory: string
  icon: string
  unit: string
  qty: number
  min_level: number
  max_level: number
  supplier: string
  storage_location_ar: string; storage_location_en: string; storage_location_sw: string
  storage_method_ar: string; storage_method_en: string; storage_method_sw: string
  expiry_date: string | null
  batch_number: string
  purchase_price: number
  cost_per_unit: number
  notes_ar: string; notes_en: string; notes_sw: string
  photo_url: string | null
  active: boolean
  created_at: string
}

export type TxnType = 'in' | 'out' | 'waste' | 'damaged' | 'adjustment' | 'returned' | 'expired'

export type InventoryTransaction = {
  id: string
  item_id: string
  type: TxnType
  qty: number
  unit: string
  datetime: string
  user_name: string
  reason: string
  notes: string
}

export type RecipeStatus = 'draft' | 'pending' | 'approved'

export type Recipe = {
  id: string
  name_ar: string; name_en: string; name_sw: string
  category: string
  status: RecipeStatus
  base_yield: number
  yield_unit_ar: string; yield_unit_en: string; yield_unit_sw: string
  prep_time_min: number
  cook_time_min: number
  storage_instructions_ar: string; storage_instructions_en: string; storage_instructions_sw: string
  shelf_life_ar: string; shelf_life_en: string; shelf_life_sw: string
  common_mistakes_ar: string; common_mistakes_en: string; common_mistakes_sw: string
  photo_url: string | null
  updated_at: string
}

export type RecipeEquipment = {
  id: string; recipe_id: string
  name_ar: string; name_en: string; name_sw: string
  sort_order: number
}

export type RecipeIngredient = {
  id: string; recipe_id: string
  item_id: string | null
  qty: number
  unit: string
  prep_state_ar: string; prep_state_en: string; prep_state_sw: string
  optional: boolean
  notes: string
  sort_order: number
}

export type RecipeStep = {
  id: string; recipe_id: string
  step_number: number
  icon: string
  short_ar: string; short_en: string; short_sw: string
  detailed_ar: string; detailed_en: string; detailed_sw: string
  warning_ar: string; warning_en: string; warning_sw: string
  qc_ar: string; qc_en: string; qc_sw: string
  photo_url: string | null
}

export type RecipeQcCheckpoint = {
  id: string; recipe_id: string
  text_ar: string; text_en: string; text_sw: string
  sort_order: number
}

export type RecipeFull = Recipe & {
  recipe_equipment: RecipeEquipment[]
  recipe_ingredients: RecipeIngredient[]
  recipe_steps: RecipeStep[]
  recipe_qc_checkpoints: RecipeQcCheckpoint[]
}

export type AssetCondition = 'new' | 'excellent' | 'good' | 'usable' | 'damaged' | 'needs_repair' | 'unusable'

export type AssetItem = {
  id: string
  name_ar: string; name_en: string; name_sw: string
  category_id: string | null
  material: string
  size_type: string
  total_qty: number
  available_qty: number
  damaged_qty: number
  missing_qty: number
  condition: AssetCondition
  storage_location_ar: string; storage_location_en: string; storage_location_sw: string
  notes: string
  photo_url: string | null
  active: boolean
  created_at: string
}

export type BuffetEvent = {
  id: string
  name: string
  event_date: string | null
  guest_count: number
  decoration_notes: string
  notes: string
  created_at: string
}

export type BuffetEventDish = {
  id: string; event_id: string
  recipe_id: string | null
  dish_name: string
  category: string
  plate_count: number
  notes: string
  sort_order: number
}

export type BuffetEventEquipment = {
  id: string; event_id: string
  asset_item_id: string | null
  per_guest_multiplier: number | null
  qty: number
  sort_order: number
}

export type BuffetEventFull = BuffetEvent & {
  buffet_event_dishes: BuffetEventDish[]
  buffet_event_equipment: BuffetEventEquipment[]
}

export type MenuTemplate = {
  id: string
  name_ar: string; name_en: string; name_sw: string
  sort_order: number
}

export type MenuTemplateDish = {
  id: string; template_id: string
  recipe_id: string | null
  dish_name: string
  category: string
  plate_count: number
  sort_order: number
}

export type MenuTemplateFull = MenuTemplate & {
  menu_template_dishes: MenuTemplateDish[]
}

export type Role = 'admin' | 'manager' | 'staff' | 'viewer'

export function canDo(role: Role, action:
  'editInventory' | 'recordTxn' | 'editRecipe' | 'manageCategories' | 'editAssets' | 'editEvents' | 'manageMenuTemplates'): boolean {
  const map: Record<string, Role[]> = {
    editInventory: ['admin', 'manager'],
    recordTxn: ['admin', 'manager', 'staff'],
    editRecipe: ['admin', 'manager'],
    manageCategories: ['admin', 'manager'],
    editAssets: ['admin', 'manager'],
    editEvents: ['admin', 'manager', 'staff'],
    manageMenuTemplates: ['admin', 'manager'],
  }
  return (map[action] || []).includes(role)
}
