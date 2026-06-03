-- 007_goals.sql
-- Savings goals and contributions

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  target_date date not null,
  icon text,
  color text,
  status text not null default 'active'
    check (status in ('active', 'completed', 'archived')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint savings_goals_id_user_unique unique (id, user_id),
  constraint savings_goals_name_length check (char_length(trim(name)) between 1 and 100)
);

drop trigger if exists set_savings_goals_updated_at on public.savings_goals;
create trigger set_savings_goals_updated_at
before update on public.savings_goals
for each row execute function public.set_updated_at();

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null,
  wallet_id uuid,
  amount numeric(14,2) not null check (amount > 0),
  contribution_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint goal_contributions_goal_owner_fk
    foreign key (goal_id, user_id)
    references public.savings_goals(id, user_id)
    on delete cascade,
  constraint goal_contributions_wallet_owner_fk
    foreign key (wallet_id, user_id)
    references public.wallets(id, user_id),
  constraint goal_contributions_notes_length
    check (notes is null or char_length(notes) <= 500)
);
