-- Create profiles table
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text default 'user' check (role in ('user', 'admin')),
  plan text default 'free' check (plan in ('free', 'basic', 'pro', 'advanced')),
  website_limit int default 1,
  keyword_limit int default 100,
  ga_token text,
  gsc_token text,
  openai_api_key text,
  member_start timestamptz,
  member_end timestamptz,
  website_url text,
  sitemap_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create user_ga_data table
create table user_ga_data (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  field text not null,
  value text,
  date date,
  created_at timestamptz default now()
);

-- Create user_gsc_data table
create table user_gsc_data (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  field text not null,
  value text,
  date date,
  created_at timestamptz default now()
);

-- Create user_ps_data table (PageSpeed data)
create table user_ps_data (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  performance float,
  accessibility float,
  seo float,
  best_practices float,
  created_at timestamptz default now()
);

-- Create crawl_details table
create table crawl_details (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  crawl_type text not null check (crawl_type in ('ga', 'gsc', 'pagespeed')),
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz default now()
);

-- Create payment_transactions table (for PayPal subscriptions)
create table payment_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id text unique,
  plan text not null,
  amount decimal(10, 2),
  currency text default 'USD',
  status text check (status in ('pending', 'completed', 'failed', 'cancelled')),
  transaction_date timestamptz,
  created_at timestamptz default now()
);

-- Create indexes for better query performance
create index idx_user_ga_data_user_id on user_ga_data(user_id, date desc);
create index idx_user_gsc_data_user_id on user_gsc_data(user_id, date desc);
create index idx_user_ps_data_user_id on user_ps_data(user_id, created_at desc);
create index idx_crawl_details_user_id on crawl_details(user_id, created_at desc);
create index idx_payment_transactions_user_id on payment_transactions(user_id, created_at desc);

-- Enable Row Level Security on all tables
alter table profiles enable row level security;
alter table user_ga_data enable row level security;
alter table user_gsc_data enable row level security;
alter table user_ps_data enable row level security;
alter table crawl_details enable row level security;
alter table payment_transactions enable row level security;

-- RLS Policy: Users can only see their own profile
create policy "Users see their own profile" on profiles
  for select using (id = auth.uid());

-- RLS Policy: Users can update their own profile
create policy "Users update their own profile" on profiles
  for update using (id = auth.uid());

-- RLS Policy: Users can insert their own profile (for signup)
create policy "Users insert their own profile" on profiles
  for insert with check (id = auth.uid());

-- RLS Policy: Users can only see their own GA data
create policy "Users see their own GA data" on user_ga_data
  for select using (user_id = auth.uid());

-- RLS Policy: Users can insert their own GA data
create policy "Users insert their own GA data" on user_ga_data
  for insert with check (user_id = auth.uid());

-- RLS Policy: Users can delete their own GA data
create policy "Users delete their own GA data" on user_ga_data
  for delete using (user_id = auth.uid());

-- RLS Policy: Users can only see their own GSC data
create policy "Users see their own GSC data" on user_gsc_data
  for select using (user_id = auth.uid());

-- RLS Policy: Users can insert their own GSC data
create policy "Users insert their own GSC data" on user_gsc_data
  for insert with check (user_id = auth.uid());

-- RLS Policy: Users can delete their own GSC data
create policy "Users delete their own GSC data" on user_gsc_data
  for delete using (user_id = auth.uid());

-- RLS Policy: Users can only see their own PageSpeed data
create policy "Users see their own PS data" on user_ps_data
  for select using (user_id = auth.uid());

-- RLS Policy: Users can insert their own PageSpeed data
create policy "Users insert their own PS data" on user_ps_data
  for insert with check (user_id = auth.uid());

-- RLS Policy: Users can delete their own PageSpeed data
create policy "Users delete their own PS data" on user_ps_data
  for delete using (user_id = auth.uid());

-- RLS Policy: Users can only see their own crawl logs
create policy "Users see their own crawl logs" on crawl_details
  for select using (user_id = auth.uid());

-- RLS Policy: Users can insert their own crawl logs
create policy "Users insert their own crawl logs" on crawl_details
  for insert with check (user_id = auth.uid());

-- RLS Policy: Users can only see their own payment transactions
create policy "Users see their own payments" on payment_transactions
  for select using (user_id = auth.uid());

-- RLS Policy: Users can insert their own payment transactions
create policy "Users insert their own payments" on payment_transactions
  for insert with check (user_id = auth.uid());

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at in profiles
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();