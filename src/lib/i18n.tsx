import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'

export type Lang = 'ar' | 'en' | 'sw'
export type LocalizedText = { ar: string; en: string; sw: string }

const dict = {
  en: {
    appName: 'Del Pasta', appSub: 'Operations & Inventory',
    nav_dashboard: 'Dashboard', nav_inventory: 'Inventory', nav_recipes: 'Recipes', nav_reports: 'Reports', nav_settings: 'Settings',
    search: 'Search ingredients, recipes…',
    add: 'Add', edit: 'Edit', delete: 'Delete', save: 'Save', cancel: 'Cancel', close: 'Close', confirm: 'Confirm',
    all: 'All', loading: 'Loading…', noResults: 'Nothing here yet.', required: 'Required',
    notes: 'Notes', photo: 'Photo', category: 'Category', subcategory: 'Subcategory', unit: 'Unit', quantity: 'Quantity',
    min: 'Min level', max: 'Max level', supplier: 'Supplier', storage: 'Storage location', storageMethod: 'Storage method',
    expiry: 'Expiry date', batch: 'Batch / lot', purchasePrice: 'Purchase price', costPerUnit: 'Cost per unit', status: 'Status',
    inStock: 'In stock', lowStock: 'Low stock', critical: 'Critical', outOfStock: 'Out of stock', expiringSoon: 'Expiring soon', expiredSt: 'Expired',
    stockIn: 'Purchase / Stock in', stockOut: 'Usage / Stock out', waste: 'Waste', damaged: 'Damaged', adjustment: 'Adjustment', returned: 'Returned', expiredTx: 'Expired',
    admin: 'Admin', manager: 'Manager', staff: 'Staff', viewer: 'Viewer', role: 'Role', language: 'Language',
    lowCriticalOut: 'Low, critical & out of stock', expiringItems: 'Expiring soon', totalItems: 'Tracked items', lowItems: 'Low / critical',
    outItems: 'Out of stock', expSoon: 'Expiring ≤5 days', totalValue: 'Inventory value', recentInventory: 'Recently added',
    yield: 'Base yield', portions: 'Portions', prepTime: 'Prep time', cookTime: 'Cook time', shelfLife: 'Shelf life', equipment: 'Equipment',
    ingredients: 'Ingredients', steps: 'Preparation steps', commonMistakes: 'Common mistakes', qcCheckpoints: 'Quality-control checkpoints',
    scaleTo: 'Scale production to', recipeCost: 'Total recipe cost', costPerBatch: 'Cost per batch', costPerPiece: 'Cost per piece',
    warning: 'Warning', qualityCheck: 'Quality check', overview: 'Overview', costTab: 'Ingredients & Cost', stepsTab: 'Steps', qcTab: 'Quality & Notes',
    recipeStatusLbl: 'Recipe status', draftSt: 'Draft', pendingSt: 'Pending review', approvedSt: 'Approved',
    newItem: 'New item', newRecipe: 'New recipe', recordTransaction: 'Record movement', transactionHistory: 'Movement history',
    print: 'Print', name: 'Name', reason: 'Reason', date: 'Date', user: 'User / staff', item: 'Item', type: 'Type',
    optionalIng: 'Optional', prepState: 'Prep state', linkItem: 'Inventory item', addIngredient: 'Add ingredient', addStep: 'Add step',
    removeRow: 'Remove', stepShort: 'Short instruction', stepDetail: 'Detailed instruction', addEquip: 'Add equipment line',
    noItemsYet: 'No inventory items yet.', noRecipesYet: 'No recipes yet.', gridView: 'Grid', listView: 'List',
    costCalcNote: 'Calculated live from current inventory cost.', active: 'Active', inactive: 'Inactive',
    dbNotConfigured: 'Supabase is not configured yet — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
    consumable: 'Consumable', asset: 'Reusable asset',
    enterPin: 'Enter the admin PIN to switch to this role', wrongPin: 'Wrong PIN.', changePin: 'Change admin PIN',
    newPin: 'New PIN', currentPin: 'Current PIN', pinChanged: 'PIN updated.',
    printCountSheet: 'Print count sheet', checkedBy: 'Checked by', pickCategoryFirst: 'Choose a specific category above first.',
    countSheetHint: 'Write the counted quantity in each date column by hand — no need to reprint between checks.',
    nav_assets: 'Buffet Equipment', newAsset: 'New equipment item', material: 'Material', sizeType: 'Size / type',
    totalOwned: 'Total owned', available: 'Available', damagedQty: 'Damaged', missingQty: 'Missing', condition: 'Condition',
    cond_new: 'New', cond_excellent: 'Excellent', cond_good: 'Good', cond_usable: 'Usable', cond_damaged: 'Damaged',
    cond_needs_repair: 'Needs repair', cond_unusable: 'Unusable', noAssetsYet: 'No buffet equipment yet.',
  },
  ar: {
    appName: 'دل باستا', appSub: 'العمليات والمخزون',
    nav_dashboard: 'لوحة التحكم', nav_inventory: 'المخزون', nav_recipes: 'الوصفات', nav_reports: 'التقارير', nav_settings: 'الإعدادات',
    search: 'ابحث عن مكوّن، وصفة…',
    add: 'إضافة', edit: 'تعديل', delete: 'حذف', save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق', confirm: 'تأكيد',
    all: 'الكل', loading: 'جارِ التحميل…', noResults: 'لا يوجد شيء هنا بعد.', required: 'مطلوب',
    notes: 'ملاحظات', photo: 'الصورة', category: 'الفئة', subcategory: 'الفئة الفرعية', unit: 'الوحدة', quantity: 'الكمية',
    min: 'الحد الأدنى', max: 'الحد الأقصى', supplier: 'المورّد', storage: 'موقع التخزين', storageMethod: 'طريقة التخزين',
    expiry: 'تاريخ الانتهاء', batch: 'رقم الدفعة', purchasePrice: 'سعر الشراء', costPerUnit: 'التكلفة لكل وحدة', status: 'الحالة',
    inStock: 'متوفر', lowStock: 'مخزون منخفض', critical: 'حرج', outOfStock: 'نفد المخزون', expiringSoon: 'قريب الانتهاء', expiredSt: 'منتهي الصلاحية',
    stockIn: 'شراء / إدخال', stockOut: 'استخدام / إخراج', waste: 'هدر', damaged: 'تالف', adjustment: 'تسوية', returned: 'مرتجع', expiredTx: 'منتهي الصلاحية',
    admin: 'مدير النظام', manager: 'مدير التشغيل', staff: 'موظف', viewer: 'مشاهد', role: 'الدور', language: 'اللغة',
    lowCriticalOut: 'منخفض، حرج، ونافد', expiringItems: 'قريبة الانتهاء', totalItems: 'عناصر متابَعة', lowItems: 'منخفض / حرج',
    outItems: 'نافد', expSoon: 'تنتهي خلال ٥ أيام', totalValue: 'قيمة المخزون', recentInventory: 'أُضيفت مؤخرًا',
    yield: 'الإنتاج الأساسي', portions: 'الحصص', prepTime: 'وقت التحضير', cookTime: 'وقت الطهي', shelfLife: 'مدة الصلاحية', equipment: 'المعدات',
    ingredients: 'المكوّنات', steps: 'خطوات التحضير', commonMistakes: 'أخطاء شائعة', qcCheckpoints: 'نقاط ضبط الجودة',
    scaleTo: 'تحجيم الإنتاج إلى', recipeCost: 'إجمالي تكلفة الوصفة', costPerBatch: 'التكلفة لكل دفعة', costPerPiece: 'التكلفة للقطعة',
    warning: 'تحذير', qualityCheck: 'فحص الجودة', overview: 'نظرة عامة', costTab: 'المكوّنات والتكلفة', stepsTab: 'الخطوات', qcTab: 'الجودة والملاحظات',
    recipeStatusLbl: 'حالة الوصفة', draftSt: 'مسودة', pendingSt: 'بانتظار المراجعة', approvedSt: 'معتمد',
    newItem: 'عنصر جديد', newRecipe: 'وصفة جديدة', recordTransaction: 'تسجيل حركة', transactionHistory: 'سجل الحركة',
    print: 'طباعة', name: 'الاسم', reason: 'السبب', date: 'التاريخ', user: 'المستخدم', item: 'العنصر', type: 'النوع',
    optionalIng: 'اختياري', prepState: 'حالة التحضير', linkItem: 'عنصر المخزون', addIngredient: 'إضافة مكوّن', addStep: 'إضافة خطوة',
    removeRow: 'إزالة', stepShort: 'تعليمات مختصرة', stepDetail: 'تعليمات مفصّلة', addEquip: 'إضافة معدة',
    noItemsYet: 'لا توجد عناصر مخزون بعد.', noRecipesYet: 'لا توجد وصفات بعد.', gridView: 'شبكة', listView: 'قائمة',
    costCalcNote: 'تُحسب مباشرة من تكلفة المخزون الحالية.', active: 'نشط', inactive: 'غير نشط',
    dbNotConfigured: 'لم يتم إعداد Supabase بعد — أضف VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env',
    consumable: 'مستهلك', asset: 'أصل قابل لإعادة الاستخدام',
    enterPin: 'أدخل رمز المدير للتبديل لهذا الدور', wrongPin: 'رمز خاطئ.', changePin: 'تغيير رمز المدير',
    newPin: 'الرمز الجديد', currentPin: 'الرمز الحالي', pinChanged: 'تم تحديث الرمز.',
    printCountSheet: 'طباعة ورقة الجرد', checkedBy: 'تم الفحص بواسطة', pickCategoryFirst: 'اختاري فئة محددة فوق أولاً.',
    countSheetHint: 'اكتبي الكمية المعدودة يدويًا في كل عمود تاريخ — بدون حاجة لإعادة الطباعة بين كل فحص.',
    nav_assets: 'معدات البوفيه', newAsset: 'معدة جديدة', material: 'الخامة', sizeType: 'الحجم / النوع',
    totalOwned: 'الإجمالي المملوك', available: 'المتاح', damagedQty: 'تالف', missingQty: 'مفقود', condition: 'الحالة',
    cond_new: 'جديد', cond_excellent: 'ممتاز', cond_good: 'جيد', cond_usable: 'قابل للاستخدام', cond_damaged: 'تالف',
    cond_needs_repair: 'يحتاج إصلاح', cond_unusable: 'غير صالح', noAssetsYet: 'لا توجد معدات بوفيه بعد.',
  },
  sw: {
    appName: 'Del Pasta', appSub: 'Uendeshaji na Hesabu',
    nav_dashboard: 'Dashibodi', nav_inventory: 'Hesabu ya Bidhaa', nav_recipes: 'Mapishi', nav_reports: 'Ripoti', nav_settings: 'Mipangilio',
    search: 'Tafuta kiungo, mapishi…',
    add: 'Ongeza', edit: 'Hariri', delete: 'Futa', save: 'Hifadhi', cancel: 'Ghairi', close: 'Funga', confirm: 'Thibitisha',
    all: 'Yote', loading: 'Inapakia…', noResults: 'Hakuna kitu bado.', required: 'Inahitajika',
    notes: 'Maelezo', photo: 'Picha', category: 'Aina', subcategory: 'Aina ndogo', unit: 'Kipimo', quantity: 'Kiasi',
    min: 'Kiwango cha chini', max: 'Kiwango cha juu', supplier: 'Muuzaji', storage: 'Mahali pa kuhifadhi', storageMethod: 'Njia ya kuhifadhi',
    expiry: 'Tarehe ya mwisho', batch: 'Nambari ya kundi', purchasePrice: 'Bei ya ununuzi', costPerUnit: 'Gharama kwa kipimo', status: 'Hali',
    inStock: 'Ipo stoo', lowStock: 'Inapungua', critical: 'Hatari', outOfStock: 'Imeisha', expiringSoon: 'Karibu kuisha', expiredSt: 'Imeisha muda',
    stockIn: 'Ununuzi / Kuingiza', stockOut: 'Matumizi / Kutoa', waste: 'Upotevu', damaged: 'Imeharibika', adjustment: 'Marekebisho', returned: 'Imerudishwa', expiredTx: 'Imeisha muda',
    admin: 'Msimamizi', manager: 'Meneja', staff: 'Mfanyakazi', viewer: 'Mtazamaji', role: 'Wadhifa', language: 'Lugha',
    lowCriticalOut: 'Inapungua, hatari, na imeisha', expiringItems: 'Karibu kuisha', totalItems: 'Bidhaa zinazofuatiliwa', lowItems: 'Inapungua / Hatari',
    outItems: 'Imeisha', expSoon: 'Inaisha ndani ya siku 5', totalValue: 'Thamani ya hesabu', recentInventory: 'Zilizoongezwa hivi karibuni',
    yield: 'Kiasi cha msingi', portions: 'Sehemu', prepTime: 'Muda wa maandalizi', cookTime: 'Muda wa kupika', shelfLife: 'Muda wa kuhifadhika', equipment: 'Vifaa',
    ingredients: 'Viungo', steps: 'Hatua za maandalizi', commonMistakes: 'Makosa ya kawaida', qcCheckpoints: 'Vituo vya udhibiti wa ubora',
    scaleTo: 'Panua uzalishaji hadi', recipeCost: 'Gharama jumla ya mapishi', costPerBatch: 'Gharama kwa kundi', costPerPiece: 'Gharama kwa kipande',
    warning: 'Onyo', qualityCheck: 'Ukaguzi wa ubora', overview: 'Muhtasari', costTab: 'Viungo na Gharama', stepsTab: 'Hatua', qcTab: 'Ubora na Maelezo',
    recipeStatusLbl: 'Hali ya mapishi', draftSt: 'Rasimu', pendingSt: 'Inasubiri ukaguzi', approvedSt: 'Imeidhinishwa',
    newItem: 'Bidhaa mpya', newRecipe: 'Mapishi mapya', recordTransaction: 'Rekodi mwendo', transactionHistory: 'Historia ya mwendo',
    print: 'Chapisha', name: 'Jina', reason: 'Sababu', date: 'Tarehe', user: 'Mtumiaji', item: 'Bidhaa', type: 'Aina',
    optionalIng: 'Hiari', prepState: 'Hali ya maandalizi', linkItem: 'Bidhaa ya hesabu', addIngredient: 'Ongeza kiungo', addStep: 'Ongeza hatua',
    removeRow: 'Ondoa', stepShort: 'Maelekezo mafupi', stepDetail: 'Maelekezo kamili', addEquip: 'Ongeza kifaa',
    noItemsYet: 'Hakuna bidhaa za hesabu bado.', noRecipesYet: 'Hakuna mapishi bado.', gridView: 'Gridi', listView: 'Orodha',
    costCalcNote: 'Inahesabiwa moja kwa moja kutoka gharama ya sasa.', active: 'Inatumika', inactive: 'Haitumiki',
    dbNotConfigured: 'Supabase haijasanidiwa bado — weka VITE_SUPABASE_URL na VITE_SUPABASE_ANON_KEY kwenye .env',
    consumable: 'Inayotumika', asset: 'Kifaa cha kurudiwa',
    enterPin: 'Weka PIN ya msimamizi kubadili hadhi hii', wrongPin: 'PIN si sahihi.', changePin: 'Badilisha PIN ya msimamizi',
    newPin: 'PIN mpya', currentPin: 'PIN ya sasa', pinChanged: 'PIN imesasishwa.',
    printCountSheet: 'Chapisha karatasi ya hesabu', checkedBy: 'Imekaguliwa na', pickCategoryFirst: 'Chagua aina mahususi juu kwanza.',
    countSheetHint: 'Andika kiasi kilichohesabiwa kwa mkono kwenye kila safu ya tarehe — hauitaji kuchapisha upya kila ukaguzi.',
    nav_assets: 'Vifaa vya Tafrija', newAsset: 'Kifaa kipya', material: 'Nyenzo', sizeType: 'Ukubwa / Aina',
    totalOwned: 'Jumla inayomilikiwa', available: 'Ipo', damagedQty: 'Imeharibika', missingQty: 'Imepotea', condition: 'Hali',
    cond_new: 'Mpya', cond_excellent: 'Bora sana', cond_good: 'Nzuri', cond_usable: 'Inatumika', cond_damaged: 'Imeharibika',
    cond_needs_repair: 'Inahitaji ukarabati', cond_unusable: 'Haitumiki', noAssetsYet: 'Hakuna vifaa vya tafrija bado.',
  },
} as const

export type TKey = keyof typeof dict.en

const I18nContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: TKey) => string
  tf: (obj: Partial<LocalizedText> | null | undefined) => string
} | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('dp_lang') as Lang) || 'ar')

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem('dp_lang', l)
    setLangState(l)
  }, [])

  const t = useCallback((k: TKey) => dict[lang][k] ?? dict.en[k] ?? k, [lang])
  const tf = useCallback((obj: Partial<LocalizedText> | null | undefined) => {
    if (!obj) return ''
    return obj[lang] || obj.en || obj.ar || obj.sw || ''
  }, [lang])

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t, tf }), [lang, setLang, t, tf])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export function emptyLocalized(): LocalizedText {
  return { ar: '', en: '', sw: '' }
}

/**
 * Reads a `<prefix>_ar` / `<prefix>_en` / `<prefix>_sw` field trio off a flat
 * DB row (our Postgres tables store localized text as suffixed columns, not
 * nested objects) and returns the current language's value, falling back to
 * English, then Arabic, then Swahili, then ''.
 */
export function pickField<T extends Record<string, unknown>>(obj: T | null | undefined, prefix: string, lang: Lang): string {
  if (!obj) return ''
  const v = (obj as Record<string, unknown>)[`${prefix}_${lang}`]
  if (typeof v === 'string' && v) return v
  for (const l of ['en', 'ar', 'sw'] as Lang[]) {
    const fallback = (obj as Record<string, unknown>)[`${prefix}_${l}`]
    if (typeof fallback === 'string' && fallback) return fallback
  }
  return ''
}
