-- 006_budgets.sql
-- Monthly budgets and budget items

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  period_type text not null default 'monthly'
    check (period_type in ('monthly')),
  period_start date not null,
  period_end date not null,
  total_limit numeric(14,2),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint budgets_id_user_unique unique (id, user_id),
  constraint budgets_name_length check (char_length(trim(name)) between 1 and 100),
  constraint budgets_valid_period check (period_start <= period_end)
);

create unique index if not exists budgets_user_period_unique
on public.budgets (user_id, period_start, period_end)
where deleted_at is null;

drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  budget_id uuid not null,
  category_id uuid not null,
  limit_amount numeric(14,2) not null check (limit_amount > 0),
  alert_threshold numeric(5,2) not null default 80
    check (alert_threshold > 0 and alert_threshold <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint budget_items_budget_owner_fk
    foreign key (budget_id, user_id)
    references public.budgets(id, user_id)
    on delete cascade,
  constraint budget_items_category_owner_fk
    foreign key (category_id, user_id)
    references public.categories(id, user_id),
  constraint budget_items_budget_category_unique unique (budget_id, category_id)
);

drop trigger if exists set_budget_items_updated_at on public.budget_items;
create trigger set_budget_items_updated_at
before update on public.budget_items
for each row execute function public.set_updated_at();

create or replace function public.validate_budget_item_category()
returns trigger
language plpgsql
as $$
declare
  category_type text;
begin
  select type
  into category_type
  from public.categories
  where id = new.category_id
    and user_id = new.user_id
    and deleted_at is null;

  if category_type is null then
    raise exception 'Invalid category';
  end if;

  if category_type <> 'expense' then
    raise exception 'Budget item category must be expense type';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_budget_item_category_trigger on public.budget_items;
create trigger validate_budget_item_category_trigger
before insert or update of category_id
on public.budget_items
for each row execute function public.validate_budget_item_category();
