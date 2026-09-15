-- Buffet event planning: guest count drives equipment quantities;
-- dishes and decoration are picked per event and printed as one sheet.
create table if not exists buffet_events (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  event_date date,
  guest_count numeric not null default 0,
  decoration_notes text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists buffet_event_dishes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references buffet_events(id) on delete cascade,
  recipe_id text references recipes(id) on delete set null,
  dish_name text not null default '',
  category text not null default '',
  plate_count numeric not null default 0,
  notes text not null default '',
  sort_order int not null default 0
);
create index if not exists idx_bed_event on buffet_event_dishes(event_id);

create table if not exists buffet_event_equipment (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references buffet_events(id) on delete cascade,
  asset_item_id uuid references asset_items(id) on delete set null,
  per_guest_multiplier numeric,
  qty numeric not null default 0,
  sort_order int not null default 0
);
create index if not exists idx_bee_event on buffet_event_equipment(event_id);

alter table buffet_events enable row level security;
alter table buffet_event_dishes enable row level security;
alter table buffet_event_equipment enable row level security;

do $$
declare tbl text;
begin
  foreach tbl in array array['buffet_events','buffet_event_dishes','buffet_event_equipment']
  loop
    execute format('drop policy if exists "allow_all_%1$s" on %1$I;', tbl);
    execute format('create policy "allow_all_%1$s" on %1$I for all using (true) with check (true);', tbl);
  end loop;
end $$;
