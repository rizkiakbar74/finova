-- 005_transactions_attachments.sql
-- Core transaction table, attachment metadata, and transaction validation trigger

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null,
  category_id uuid not null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14,2) not null check (amount > 0),
  transaction_date date not null,
  merchant text,
  notes text,
  status text not null default 'posted'
    check (status in ('posted', 'pending')),
  is_recurring boolean not null default false,
  recurring_bill_id uuid,
  subscription_id uuid,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint transactions_id_user_unique unique (id, user_id),
  constraint transactions_wallet_owner_fk
    foreign key (wallet_id, user_id)
    references public.wallets(id, user_id),
  constraint transactions_category_owner_fk
    foreign key (category_id, user_id)
    references public.categories(id, user_id),
  constraint transactions_merchant_length
    check (merchant is null or char_length(merchant) <= 120),
  constraint transactions_notes_length
    check (notes is null or char_length(notes) <= 500)
);

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

create or replace function public.validate_transaction_category_type()
returns trigger
language plpgsql
as $$
declare
  category_type text;
  wallet_exists boolean;
begin
  select exists(
    select 1
    from public.wallets
    where id = new.wallet_id
      and user_id = new.user_id
      and deleted_at is null
  ) into wallet_exists;

  if wallet_exists is not true then
    raise exception 'Invalid wallet';
  end if;

  select type
  into category_type
  from public.categories
  where id = new.category_id
    and user_id = new.user_id
    and deleted_at is null;

  if category_type is null then
    raise exception 'Invalid category';
  end if;

  if category_type <> new.type then
    raise exception 'Category type must match transaction type';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_transaction_category_type_trigger on public.transactions;
create trigger validate_transaction_category_type_trigger
before insert or update of wallet_id, category_id, type
on public.transactions
for each row execute function public.validate_transaction_category_type();

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid,
  file_name text not null,
  file_path text not null,
  file_type text not null check (file_type in ('png', 'jpg', 'jpeg', 'pdf')),
  file_size integer not null check (file_size > 0 and file_size <= 5242880),
  bucket text not null default 'receipts',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint attachments_transaction_owner_fk
    foreign key (transaction_id, user_id)
    references public.transactions(id, user_id)
);
