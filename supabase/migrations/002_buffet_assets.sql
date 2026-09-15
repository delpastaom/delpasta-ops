-- Buffet equipment / reusable assets (plates, trays, stands...) — separate from consumable inventory.
create table if not exists asset_items (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null default '',
  name_en text not null default '',
  name_sw text not null default '',
  category_id text references categories(id) on delete set null,
  material text not null default '',
  size_type text not null default '',
  total_qty numeric not null default 0,
  available_qty numeric not null default 0,
  damaged_qty numeric not null default 0,
  missing_qty numeric not null default 0,
  condition text not null default 'good' check (condition in ('new','excellent','good','usable','damaged','needs_repair','unusable')),
  storage_location_ar text not null default '',
  storage_location_en text not null default '',
  storage_location_sw text not null default '',
  notes text not null default '',
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table asset_items enable row level security;
drop policy if exists "allow_all_asset_items" on asset_items;
create policy "allow_all_asset_items" on asset_items for all using (true) with check (true);

-- Example "intended use" categories for buffet equipment (kind = 'asset').
-- Edit/add more any time from Settings → Categories.
insert into categories (id, name_ar, name_en, name_sw, kind, sort_order) values
  ('asset-salad', 'أطباق سلطة', 'Salad Dishes', 'Sahani za Saladi', 'asset', 20),
  ('asset-appetizers', 'أطباق خفايف', 'Appetizer Dishes', 'Sahani za Vitafunio', 'asset', 21),
  ('asset-desserts', 'أطباق حلويات', 'Dessert Dishes', 'Sahani za Vitamu', 'asset', 22),
  ('asset-stands', 'ستاندات', 'Stands', 'Viunzi', 'asset', 23),
  ('asset-mains', 'أطباق أطباق رئيسية', 'Main Dish Trays', 'Trei za Chakula Kikuu', 'asset', 24),
  ('asset-serving', 'أدوات تقديم', 'Serving Tools', 'Vifaa vya Kutumikia', 'asset', 25)
on conflict (id) do update set name_ar = excluded.name_ar, name_en = excluded.name_en, name_sw = excluded.name_sw;
