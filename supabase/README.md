# Supabase Live Setup for WSMT Social Media

Migration file created:

- supabase/migrations/20260628145000_initial_wsmt_schema.sql

## Apply with Supabase Dashboard

1. Open your Supabase project.
2. Go to SQL Editor.
3. Paste the migration SQL file contents.
4. Run it.

## Apply with Supabase CLI

1. Install/login to Supabase CLI.
2. Run: supabase link --project-ref YOUR_PROJECT_REF
3. Run: supabase db push

## Frontend environment

Set these in .env for local Vite or in your deployment provider:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Do not expose service role keys in frontend code.
