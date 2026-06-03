-- 014_backfill_existing_auth_users.sql
-- Optional safety migration for users created before Phase 3 schema was installed.
-- It backfills profile/settings/preference rows for existing auth.users.

insert into public.profiles (id, full_name, created_at)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.created_at, now())
from auth.users u
on conflict (id) do nothing;

insert into public.user_settings (user_id)
select u.id
from auth.users u
on conflict (user_id) do nothing;

insert into public.notification_preferences (user_id)
select u.id
from auth.users u
on conflict (user_id) do nothing;
