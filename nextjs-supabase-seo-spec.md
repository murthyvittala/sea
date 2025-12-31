Next.js + Supabase SEO Analytics SaaS --- Full Development Specification
Prompt

Overview

Build a complete SEO Analytics SaaS platform using Next.js (App
Router) + Supabase backend. Your job is to generate complete
production‑grade code for all components listed below.

------------------------------------------------------------------------

1.  AUTHENTICATION MODULE (Next.js + Supabase)

Requirements

1.  User login with:
    -   Email + Password
    -   Google OAuth
    -   Facebook OAuth
    -   LinkedIn OAuth
2.  Pricing Plans (stored in Supabase profiles):
    -   Free -- \$0 -- 1 website limit -- 100 keyword rows limit
    -   Basic -- \$9.95 -- 3 websites
    -   Pro -- \$29.95 -- 10 websites
    -   Advanced -- \$49.95 -- unlimited websites
3.  Checkout via PayPal Subscription
    -   After successful payment → redirect to Dashboard

Required Outputs

-   Next.js pages:
    -   /login
    -   /register
    -   /pricing
    -   /auth/callback (OAuth)
-   Supabase auth code
-   Role assignment logic after subscription
-   Webhooks for PayPal subscription verification

------------------------------------------------------------------------

2.  DASHBOARD MODULE

Requirements

After login: 1. Show dashboard homepage 2. Left-hand collapsible menu: -
Keywords - Traffic - PageSpeed 3. Header: - User profile icon → Settings
page

Settings Page Fields

-   Role: free/basic/pro/advanced
-   Tokens:
    -   GA Token
    -   GSC Token
    -   ChatGPT API key
-   Membership start date
-   Membership expiry or renewal date
-   Website URL
-   Sitemap URL

------------------------------------------------------------------------

3.  USER ROLES

Roles

-   Admin
    -   View all users
-   User
    -   free / basic / pro / advanced

Storage

Supabase profiles table: - id - role - plan - website_limit -
keyword_limit - ga_token - gsc_token - openai_api_key - member_start -
member_end - website_url - sitemap_url

------------------------------------------------------------------------

4.  GA4 INTEGRATION MODULE

Requirements

1.  After subscription → user authorizes GA4
2.  Retrieve last 3 months data
3.  Store in Supabase table: user_ga_data
4.  Strict RLS so one user cannot see another's data
5.  Save GA token in profiles.ga_token
6.  Store crawl logs in table: crawl_details

Fields to Fetch

All possible GA4 fields: - Sessions - Users - Pageviews - Events -
Conversions - Traffic sources - Devices - Geo - etc.

------------------------------------------------------------------------

5.  GSC INTEGRATION MODULE

Requirements

1.  User authorizes GSC access
2.  Get last 3 months of data
3.  Save to Supabase table: user_gsc_data
4.  Strict RLS
5.  Save GSC token to profiles.gsc_token
6.  Save crawl logs to crawl_details

------------------------------------------------------------------------

6.  PAGESPEED INSIGHTS MODULE

Requirements

1.  For every URL in sitemap:
    -   fetch PageSpeed Insights
2.  Limit:
    -   Free users: 50 URLs max
    -   Others: unlimited
3.  Save results to:
    -   user_ps_data

------------------------------------------------------------------------

7.  MENU COMPONENTS

Traffic Menu

-   Fetch from user_ga_data
-   Pagination: 100 rows/page
-   Filters
-   Search

Keywords Menu

-   Fetch from user_gsc_data
-   Pagination: 100 rows/page
-   Filters
-   Search

PageSpeed Menu

-   Fetch from user_ps_data
-   Pagination: 100 rows/page
-   Filters
-   Search

------------------------------------------------------------------------

8.  SUPABASE DATABASE SCHEMA

profiles

    create table profiles (
      id uuid primary key references auth.users(id) on delete cascade,
      role text default 'user',
      plan text,
      website_limit int,
      keyword_limit int,
      ga_token text,
      gsc_token text,
      openai_api_key text,
      member_start timestamptz,
      member_end timestamptz,
      website_url text,
      sitemap_url text,
      created_at timestamptz default now()
    );

user_ga_data

    create table user_ga_data (
      id bigint generated always as identity primary key,
      user_id uuid references auth.users(id),
      field text,
      value text,
      date date,
      created_at timestamptz default now()
    );

user_gsc_data

    create table user_gsc_data (
      id bigint generated always as identity primary key,
      user_id uuid references auth.users(id),
      field text,
      value text,
      date date,
      created_at timestamptz default now()
    );

user_ps_data

    create table user_ps_data (
      id bigint generated always as identity primary key,
      user_id uuid references auth.users(id),
      url text,
      performance float,
      accessibility float,
      seo float,
      best_practices float,
      created_at timestamptz default now()
    );

crawl_details

    create table crawl_details (
      id bigint generated always as identity primary key,
      user_id uuid references auth.users(id),
      crawl_type text,
      start_time timestamptz,
      end_time timestamptz,
      created_at timestamptz default now()
    );

------------------------------------------------------------------------

9.  RLS POLICIES (ALL TABLES)

    alter table profiles enable row level security; alter table
    user_ga_data enable row level security; alter table user_gsc_data
    enable row level security; alter table user_ps_data enable row level
    security; alter table crawl_details enable row level security;

    create policy "Users see their own profile" on profiles for select
    using (id = auth.uid());

    create policy "Users manage own GA data" on user_ga_data for select
    using (user_id = auth.uid());

    create policy "Users manage own GSC data" on user_gsc_data for
    select using (user_id = auth.uid());

    create policy "Users manage own PS data" on user_ps_data for select
    using (user_id = auth.uid());

    create policy "Users manage their crawl logs" on crawl_details for
    select using (user_id = auth.uid());

------------------------------------------------------------------------

10. DESIGN REQUIREMENTS

-   Colors: white, grey, professional blue
-   Mobile‑responsive
-   All buttons use elegant blue theme
-   Sidebar collapsible
-   Clean dashboard UI

------------------------------------------------------------------------

11. OUTPUT FORMAT FOR LLM

When generating code, the LLM must output:

1.  Next.js components

2.  API routes

3.  Hooks for GA/GSC auth

4.  Dashboard UI

5.  Supabase client setup

6.  Database migrations

7.  Auth pages

8.  Payment integration

9.  Data fetchers + pagination

The output must be production‑grade, modular, and aligned with the
folder structure:

    /app
      /auth
      /dashboard
      /api
      /settings
      /keywords
      /traffic
      /pagespeed
    /lib
      supabase.ts
    /components
      ui/
      charts/
