-- Reusable buffet menu templates (standard dish lists) that can be
-- loaded into a new event and then adjusted per event.
create table if not exists menu_templates (
  id text primary key,
  name_ar text not null default '',
  name_en text not null default '',
  name_sw text not null default '',
  sort_order int not null default 0
);

create table if not exists menu_template_dishes (
  id uuid primary key default gen_random_uuid(),
  template_id text not null references menu_templates(id) on delete cascade,
  recipe_id text references recipes(id) on delete set null,
  dish_name text not null default '',
  category text not null default '',
  plate_count numeric not null default 0,
  sort_order int not null default 0
);
create index if not exists idx_mtd_template on menu_template_dishes(template_id);

alter table menu_templates enable row level security;
alter table menu_template_dishes enable row level security;
drop policy if exists "allow_all_menu_templates" on menu_templates;
create policy "allow_all_menu_templates" on menu_templates for all using (true) with check (true);
drop policy if exists "allow_all_menu_template_dishes" on menu_template_dishes;
create policy "allow_all_menu_template_dishes" on menu_template_dishes for all using (true) with check (true);
