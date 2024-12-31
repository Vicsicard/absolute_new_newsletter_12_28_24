-- Create error_logs table
create table if not exists error_logs (
  id uuid primary key default uuid_generate_v4(),
  timestamp timestamptz not null,
  error_type text not null,
  message text not null,
  stack text,
  context jsonb,
  created_at timestamptz default now()
);

-- Add indexes for querying error logs
create index if not exists error_logs_timestamp_idx on error_logs (timestamp desc);
create index if not exists error_logs_error_type_idx on error_logs (error_type);

-- Add new columns to newsletter_generation_queue for better error tracking
alter table newsletter_generation_queue
  add column if not exists last_error text,
  add column if not exists error_count int default 0,
  add column if not exists last_attempt_at timestamptz;

-- Create function to clean up old error logs (keep last 30 days)
create or replace function cleanup_old_error_logs()
returns void
language plpgsql
as $$
begin
  delete from error_logs
  where timestamp < now() - interval '30 days';
end;
$$;

-- Create a scheduled job to clean up old error logs
select cron.schedule(
  'cleanup-error-logs',
  '0 0 * * *', -- Run at midnight every day
  'select cleanup_old_error_logs()'
);
