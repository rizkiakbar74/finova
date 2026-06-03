-- 013_default_categories.sql
-- Default user categories for onboarding

create or replace function public.create_default_categories(target_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Safety guard: default categories can only be created for the authenticated user.
  if auth.uid() is null or target_user_id <> auth.uid() then
    raise exception 'Not allowed to create categories for another user';
  end if;

  insert into public.categories (user_id, name, type, color, icon, is_default)
  values
    (target_user_id, 'Salary', 'income', '#10B981', 'briefcase', true),
    (target_user_id, 'Freelance', 'income', '#3B82F6', 'laptop', true),
    (target_user_id, 'Business', 'income', '#8B5CF6', 'building', true),
    (target_user_id, 'Bonus', 'income', '#F59E0B', 'gift', true),
    (target_user_id, 'Other Income', 'income', '#6B7280', 'plus-circle', true),
    (target_user_id, 'Housing', 'expense', '#10B981', 'home', true),
    (target_user_id, 'Food & Dining', 'expense', '#F97316', 'utensils', true),
    (target_user_id, 'Transport', 'expense', '#3B82F6', 'car', true),
    (target_user_id, 'Shopping', 'expense', '#EC4899', 'shopping-bag', true),
    (target_user_id, 'Entertainment', 'expense', '#8B5CF6', 'gamepad-2', true),
    (target_user_id, 'Bills & Utilities', 'expense', '#F59E0B', 'bolt', true),
    (target_user_id, 'Health & Fitness', 'expense', '#14B8A6', 'heart-pulse', true),
    (target_user_id, 'Education', 'expense', '#6366F1', 'book-open', true),
    (target_user_id, 'Other', 'expense', '#6B7280', 'more-horizontal', true)
  on conflict do nothing;
end;
$$;

revoke all on function public.create_default_categories(uuid) from public;
grant execute on function public.create_default_categories(uuid) to authenticated;
