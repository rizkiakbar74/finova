-- 009_notifications_reports_audit.sql
-- Notifications, report exports, and audit logs

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null
    check (type in ('budget', 'bill', 'goal', 'account', 'security', 'subscription', 'system')),
  severity text not null default 'low'
    check (severity in ('low', 'medium', 'high')),
  title text not null,
  message text not null,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_title_length check (char_length(trim(title)) between 1 and 160),
  constraint notifications_message_length check (char_length(trim(message)) between 1 and 500)
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null
    check (report_type in (
      'monthly_summary',
      'spending_by_category',
      'cashflow',
      'tax_summary',
      'savings_progress',
      'net_worth'
    )),
  export_format text not null check (export_format in ('csv', 'pdf')),
  date_from date not null,
  date_to date not null,
  file_path text,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  constraint report_exports_valid_date_range check (date_from <= date_to)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_length check (char_length(trim(action)) between 1 and 100),
  constraint audit_logs_entity_type_length check (char_length(trim(entity_type)) between 1 and 100)
);
