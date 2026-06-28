-- WSMT Social Media initial Supabase schema
-- Apply in Supabase SQL editor or with: supabase db push

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default 'Member',
  account_type text not null default 'Creator',
  location text,
  website text,
  bio text,
  avatar_url text,
  cover_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  post_type text not null default 'text',
  media_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  privacy text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create table if not exists public.marketplace_items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  price text,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  description text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.advertisements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_page_id uuid references public.business_pages(id) on delete set null,
  name text not null,
  ad_type text not null default 'Sponsored post',
  budget text,
  status text not null default 'review',
  result text not null default 'Pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  plan_name text not null default 'WSMT $1/month',
  amount_cents integer not null default 100,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at before update on public.posts for each row execute function public.touch_updated_at();
drop trigger if exists groups_touch_updated_at on public.groups;
create trigger groups_touch_updated_at before update on public.groups for each row execute function public.touch_updated_at();
drop trigger if exists marketplace_items_touch_updated_at on public.marketplace_items;
create trigger marketplace_items_touch_updated_at before update on public.marketplace_items for each row execute function public.touch_updated_at();
drop trigger if exists business_pages_touch_updated_at on public.business_pages;
create trigger business_pages_touch_updated_at before update on public.business_pages for each row execute function public.touch_updated_at();
drop trigger if exists advertisements_touch_updated_at on public.advertisements;
create trigger advertisements_touch_updated_at before update on public.advertisements for each row execute function public.touch_updated_at();
drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at before update on public.subscriptions for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, status)
  values (new.id, 'inactive')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.marketplace_items enable row level security;
alter table public.business_pages enable row level security;
alter table public.advertisements enable row level security;
alter table public.subscriptions enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and is_admin = true);
$$;

-- profiles
create policy "profiles are readable" on public.profiles for select using (true);
create policy "users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id or public.is_admin()) with check (auth.uid() = id or public.is_admin());

-- posts
create policy "posts are readable" on public.posts for select using (true);
create policy "users create own posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "users update own posts" on public.posts for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "users delete own posts" on public.posts for delete using (auth.uid() = user_id or public.is_admin());

-- comments
create policy "comments are readable" on public.comments for select using (true);
create policy "users create own comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "users update own comments" on public.comments for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
create policy "users delete own comments" on public.comments for delete using (auth.uid() = user_id or public.is_admin());

-- likes
create policy "likes are readable" on public.likes for select using (true);
create policy "users create own likes" on public.likes for insert with check (auth.uid() = user_id);
create policy "users delete own likes" on public.likes for delete using (auth.uid() = user_id);

-- bookmarks
create policy "users read own bookmarks" on public.bookmarks for select using (auth.uid() = user_id or public.is_admin());
create policy "users create own bookmarks" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "users delete own bookmarks" on public.bookmarks for delete using (auth.uid() = user_id);

-- groups and members
create policy "public groups are readable" on public.groups for select using (privacy = 'public' or owner_id = auth.uid() or public.is_admin());
create policy "users create owned groups" on public.groups for insert with check (auth.uid() = owner_id);
create policy "owners update groups" on public.groups for update using (auth.uid() = owner_id or public.is_admin()) with check (auth.uid() = owner_id or public.is_admin());
create policy "owners delete groups" on public.groups for delete using (auth.uid() = owner_id or public.is_admin());
create policy "group members readable" on public.group_members for select using (true);
create policy "users join as self" on public.group_members for insert with check (auth.uid() = user_id);
create policy "users leave as self" on public.group_members for delete using (auth.uid() = user_id or public.is_admin());

-- marketplace
create policy "active marketplace items readable" on public.marketplace_items for select using (status = 'active' or seller_id = auth.uid() or public.is_admin());
create policy "users create own marketplace items" on public.marketplace_items for insert with check (auth.uid() = seller_id);
create policy "users update own marketplace items" on public.marketplace_items for update using (auth.uid() = seller_id or public.is_admin()) with check (auth.uid() = seller_id or public.is_admin());
create policy "users delete own marketplace items" on public.marketplace_items for delete using (auth.uid() = seller_id or public.is_admin());

-- business pages
create policy "business pages readable" on public.business_pages for select using (true);
create policy "users create owned business pages" on public.business_pages for insert with check (auth.uid() = owner_id);
create policy "owners update business pages" on public.business_pages for update using (auth.uid() = owner_id or public.is_admin()) with check (auth.uid() = owner_id or public.is_admin());
create policy "owners delete business pages" on public.business_pages for delete using (auth.uid() = owner_id or public.is_admin());

-- advertisements
create policy "owners and admins read advertisements" on public.advertisements for select using (auth.uid() = owner_id or public.is_admin());
create policy "users create owned advertisements" on public.advertisements for insert with check (auth.uid() = owner_id);
create policy "owners update advertisements" on public.advertisements for update using (auth.uid() = owner_id or public.is_admin()) with check (auth.uid() = owner_id or public.is_admin());
create policy "owners delete advertisements" on public.advertisements for delete using (auth.uid() = owner_id or public.is_admin());

-- subscriptions
create policy "users read own subscription" on public.subscriptions for select using (auth.uid() = user_id or public.is_admin());
create policy "users create own subscription placeholder" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "users update own local subscription placeholder" on public.subscriptions for update using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());
