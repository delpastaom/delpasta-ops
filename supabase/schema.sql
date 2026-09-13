-- Del Pasta Ops — database schema
-- Run this once in your Supabase project's SQL editor (Supabase Dashboard → SQL Editor → New query → paste → Run).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / CREATE OR REPLACE.

create extension if not exists "pgcrypto";

-- ============================= Categories =============================
create table if not exists categories (
  id text primary key,
  name_ar text not null default '',
  name_en text not null default '',
  name_sw text not null default '',
  kind text not null default 'consumable' check (kind in ('consumable','asset')),
  sort_order int not null default 0
);

-- ============================= Inventory =============================
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null default '',
  name_en text not null default '',
  name_sw text not null default '',
  category_id text references categories(id) on delete set null,
  subcategory text not null default '',
  icon text not null default 'default',
  unit text not null default 'kg',
  qty numeric not null default 0,
  min_level numeric not null default 0,
  max_level numeric not null default 0,
  supplier text not null default '',
  storage_location_ar text not null default '',
  storage_location_en text not null default '',
  storage_location_sw text not null default '',
  storage_method_ar text not null default '',
  storage_method_en text not null default '',
  storage_method_sw text not null default '',
  expiry_date date,
  batch_number text not null default '',
  purchase_price numeric not null default 0,
  cost_per_unit numeric not null default 0,
  notes_ar text not null default '',
  notes_en text not null default '',
  notes_sw text not null default '',
  photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id) on delete cascade,
  type text not null check (type in ('in','out','waste','damaged','adjustment','returned','expired')),
  qty numeric not null default 0,
  unit text not null default '',
  datetime timestamptz not null default now(),
  user_name text not null default '',
  reason text not null default '',
  notes text not null default ''
);
create index if not exists idx_inv_txn_item on inventory_transactions(item_id);

-- ============================= Recipes =============================
create table if not exists recipes (
  id text primary key,
  name_ar text not null default '',
  name_en text not null default '',
  name_sw text not null default '',
  category text not null default '',
  status text not null default 'draft' check (status in ('draft','pending','approved')),
  base_yield numeric not null default 100,
  yield_unit_ar text not null default '',
  yield_unit_en text not null default '',
  yield_unit_sw text not null default '',
  prep_time_min int not null default 0,
  cook_time_min int not null default 0,
  storage_instructions_ar text not null default '',
  storage_instructions_en text not null default '',
  storage_instructions_sw text not null default '',
  shelf_life_ar text not null default '',
  shelf_life_en text not null default '',
  shelf_life_sw text not null default '',
  common_mistakes_ar text not null default '',
  common_mistakes_en text not null default '',
  common_mistakes_sw text not null default '',
  photo_url text,
  updated_at timestamptz not null default now()
);

create table if not exists recipe_equipment (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null references recipes(id) on delete cascade,
  name_ar text not null default '',
  name_en text not null default '',
  name_sw text not null default '',
  sort_order int not null default 0
);

create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null references recipes(id) on delete cascade,
  item_id uuid references inventory_items(id) on delete set null,
  qty numeric not null default 0,
  unit text not null default '',
  prep_state_ar text not null default '',
  prep_state_en text not null default '',
  prep_state_sw text not null default '',
  optional boolean not null default false,
  notes text not null default '',
  sort_order int not null default 0
);
create index if not exists idx_recipe_ing_recipe on recipe_ingredients(recipe_id);

create table if not exists recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null references recipes(id) on delete cascade,
  step_number int not null default 1,
  icon text not null default 'default',
  short_ar text not null default '',
  short_en text not null default '',
  short_sw text not null default '',
  detailed_ar text not null default '',
  detailed_en text not null default '',
  detailed_sw text not null default '',
  warning_ar text not null default '',
  warning_en text not null default '',
  warning_sw text not null default '',
  qc_ar text not null default '',
  qc_en text not null default '',
  qc_sw text not null default '',
  photo_url text
);
create index if not exists idx_recipe_steps_recipe on recipe_steps(recipe_id);

create table if not exists recipe_qc_checkpoints (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null references recipes(id) on delete cascade,
  text_ar text not null default '',
  text_en text not null default '',
  text_sw text not null default '',
  sort_order int not null default 0
);

-- ============================= Audit log =============================
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_name text not null default '',
  role text not null default '',
  action text not null default '',
  target text not null default '',
  details text not null default '',
  timestamp timestamptz not null default now()
);

-- ============================= Row Level Security =============================
-- This app has no per-user login (a shared internal tool), so we allow the
-- anon key full read/write. Do NOT expose the anon key outside your team.
alter table categories enable row level security;
alter table inventory_items enable row level security;
alter table inventory_transactions enable row level security;
alter table recipes enable row level security;
alter table recipe_equipment enable row level security;
alter table recipe_ingredients enable row level security;
alter table recipe_steps enable row level security;
alter table recipe_qc_checkpoints enable row level security;
alter table audit_log enable row level security;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['categories','inventory_items','inventory_transactions','recipes','recipe_equipment','recipe_ingredients','recipe_steps','recipe_qc_checkpoints','audit_log']
  loop
    execute format('drop policy if exists "allow_all_%1$s" on %1$I;', tbl);
    execute format('create policy "allow_all_%1$s" on %1$I for all using (true) with check (true);', tbl);
  end loop;
end $$;

-- ============================= Storage bucket for photos =============================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "public_read_photos" on storage.objects;
create policy "public_read_photos" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "anon_write_photos" on storage.objects;
create policy "anon_write_photos" on storage.objects for insert with check (bucket_id = 'photos');
drop policy if exists "anon_update_photos" on storage.objects;
create policy "anon_update_photos" on storage.objects for update using (bucket_id = 'photos');
drop policy if exists "anon_delete_photos" on storage.objects;
create policy "anon_delete_photos" on storage.objects for delete using (bucket_id = 'photos');
