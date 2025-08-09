-- Enable extensions
create extension if not exists pg_trgm;
create extension if not exists postgis;

-- users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  avatar_url text,
  phone text,
  is_verified boolean default false,
  created_at timestamptz default now()
);

-- listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade,
  title text not null,
  description text,
  price numeric(12,2),
  category text,
  lat double precision,
  lng double precision,
  geom geography(Point,4326) generated always as (ST_SetSRID(ST_MakePoint(lng, lat),4326)::geography) stored,
  images jsonb default '[]',
  status text default 'active',        -- active | sold | expired
  promoted_type text default 'none',   -- none | spotlight | top
  created_at timestamptz default now(),
  expires_at timestamptz generated always as (created_at + interval '30 days') stored
);

-- chat
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  last_message text,
  updated_at timestamptz default now()
);
create table if not exists public.participants (
  thread_id uuid references public.threads(id) on delete cascade,
  user_id   uuid references public.users(id)   on delete cascade,
  primary key (thread_id, user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.threads(id) on delete cascade,
  sender_id uuid references public.users(id)   on delete cascade,
  body text,
  image_urls jsonb default '[]',
  created_at timestamptz default now(),
  read_by jsonb default '[]'
);

-- favourites
create table if not exists public.favourites (
  user_id uuid references public.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

-- reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  from_uid uuid references public.users(id) on delete cascade,
  to_uid   uuid references public.users(id) on delete cascade,
  listing_id uuid references public.listings(id),
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id),
  target_type text,  -- listing | user | message
  target_id uuid,
  reason text,
  status text default 'open',
  created_at timestamptz default now()
);

-- Indexes
create index if not exists listings_geom_gist on public.listings using gist(geom);
create index if not exists listings_search_gin on public.listings using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));
create index if not exists messages_thread_created_idx on public.messages(thread_id, created_at desc);

-- Search RPC for PostgREST
create or replace function public.rpc_search_listings(
  q text default null,
  cat text default null,
  min_price numeric default null,
  max_price numeric default null,
  center_lat double precision default null,
  center_lng double precision default null,
  radius_km double precision default 50
) returns setof public.listings
language sql stable security definer
as $$
  select * from public.listings
  where status='active'
    and (q is null or (title ilike '%'||q||'%' or description ilike '%'||q||'%'))
    and (cat is null or category = cat)
    and (min_price is null or price >= min_price)
    and (max_price is null or price <= max_price)
    and (
      center_lat is null or center_lng is null
      or ST_DWithin(geom, ST_SetSRID(ST_MakePoint(center_lng, center_lat),4326)::geography, radius_km*1000)
    )
  order by created_at desc;
$$;
grant execute on function public.rpc_search_listings to anon, authenticated;

-- RLS POLICIES (essentials)
alter table public.listings   enable row level security;
alter table public.threads    enable row level security;
alter table public.participants enable row level security;
alter table public.messages   enable row level security;
alter table public.favourites enable row level security;
alter table public.reviews    enable row level security;
alter table public.reports    enable row level security;

-- listings: read all, write only owner
do $$ begin
  create policy listings_select on public.listings for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy listings_write  on public.listings for all
    using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

-- threads/messages: participants only
do $$ begin
  create policy threads_rw on public.threads
    for all using (exists (select 1 from public.participants p where p.thread_id=id and p.user_id=auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy messages_rw on public.messages
    for all using (auth.uid() in (select user_id from public.participants where thread_id=messages.thread_id));
exception when duplicate_object then null; end $$;

-- favourites/reviews/reports: owner can insert/select their rows; reads limited appropriately
do $$ begin
  create policy favourites_rw on public.favourites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy reviews_insert on public.reviews for insert with check (auth.uid() = from_uid);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy reviews_read   on public.reviews for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy reports_insert on public.reports for insert with check (auth.uid() = reporter_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy reports_read   on public.reports for select using (auth.role() = 'service_role');
exception when duplicate_object then null; end $$;

-- STORAGE (buckets + policies)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Public read
do $$ begin
  create policy "Public read avatars" on storage.objects for select
    using (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Public read listing-images" on storage.objects for select
    using (bucket_id = 'listing-images');
exception when duplicate_object then null; end $$;

-- Avatars: users/{uid}.jpg write by owner
do $$ begin
  create policy "Avatar upload by owner" on storage.objects for insert to authenticated
    with check (
      bucket_id = 'avatars'
      and (
        split_part(name, '/', 1) = 'users'
        and split_part(name, '/', 2) = auth.uid()::text
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Avatar update/delete by owner" on storage.objects for update using (
      bucket_id = 'avatars'
      and split_part(name, '/', 1) = 'users'
      and split_part(name, '/', 2) = auth.uid()::text
    ) with check (
      bucket_id = 'avatars'
      and split_part(name, '/', 1) = 'users'
      and split_part(name, '/', 2) = auth.uid()::text
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Avatar delete by owner" on storage.objects for delete using (
      bucket_id = 'avatars'
      and split_part(name, '/', 1) = 'users'
      and split_part(name, '/', 2) = auth.uid()::text
    );
exception when duplicate_object then null; end $$;

-- Listing images: listings/{listing_id}/{uuid}.jpg write by listing owner
do $$ begin
  create policy "Listing image upload by listing owner" on storage.objects for insert to authenticated
    with check (
      bucket_id = 'listing-images'
      and split_part(name, '/', 1) = 'listings'
      and exists (
        select 1 from public.listings l
        where l.id = split_part(name, '/', 2)::uuid and l.owner_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Listing image update by listing owner" on storage.objects for update using (
      bucket_id = 'listing-images'
      and split_part(name, '/', 1) = 'listings'
      and exists (
        select 1 from public.listings l
        where l.id = split_part(name, '/', 2)::uuid and l.owner_id = auth.uid()
      )
    ) with check (
      bucket_id = 'listing-images'
      and split_part(name, '/', 1) = 'listings'
      and exists (
        select 1 from public.listings l
        where l.id = split_part(name, '/', 2)::uuid and l.owner_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Listing image delete by listing owner" on storage.objects for delete using (
      bucket_id = 'listing-images'
      and split_part(name, '/', 1) = 'listings'
      and exists (
        select 1 from public.listings l
        where l.id = split_part(name, '/', 2)::uuid and l.owner_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;


