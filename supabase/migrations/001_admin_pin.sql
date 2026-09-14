-- Adds a shared admin PIN so switching to Admin/Manager role requires it.
create table if not exists app_settings (
  key text primary key,
  value text not null default ''
);
alter table app_settings enable row level security;
drop policy if exists "allow_all_app_settings" on app_settings;
create policy "allow_all_app_settings" on app_settings for all using (true) with check (true);

insert into app_settings (key, value) values ('admin_pin', '1234')
on conflict (key) do nothing;
