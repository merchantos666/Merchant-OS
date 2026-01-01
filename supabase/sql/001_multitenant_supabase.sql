-- Supabase multi-tenant schema and RLS for the ecommerce SaaS.
-- Run with `supabase db push` or apply in the dashboard SQL editor.

-- Extensions used for UUID generation.
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Role enum for store memberships.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'member_role') then
    create type public.member_role as enum ('owner', 'admin', 'editor', 'viewer');
  end if;
end $$;

-- Stores (tenants).
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_public boolean not null default true,
  is_active boolean not null default true,
  brand jsonb not null default '{}'::jsonb,
  plan text not null default 'free',
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_slug_lowercase check (slug = lower(slug)),
  constraint stores_plan_check check (plan in ('free', 'paid'))
);
create unique index if not exists stores_slug_ci_idx on public.stores (lower(slug));
create index if not exists stores_created_by_idx on public.stores (created_by);
alter table if exists public.stores alter column created_by set default auth.uid();
alter table if exists public.stores alter column brand set default '{}'::jsonb;
update public.stores set brand = '{}'::jsonb where brand is null;
alter table if exists public.stores add column if not exists plan text;
update public.stores set plan = coalesce(plan, 'free');
alter table if exists public.stores alter column plan set not null;
alter table if exists public.stores alter column plan set default 'free';
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'stores_plan_check'
      and conrelid = 'public.stores'::regclass
  ) then
    alter table public.stores add constraint stores_plan_check check (plan in ('free', 'paid'));
  end if;
end $$;

-- Memberships (per-user roles inside a store).
create table if not exists public.store_memberships (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);
create index if not exists store_memberships_user_idx on public.store_memberships (user_id);

-- Helper to check membership (used by RLS policies).
create or replace function public.is_store_member(
  p_store_id uuid,
  allowed_roles text[] default array['owner', 'admin', 'editor', 'viewer']
) returns boolean
language sql
stable
as $$
  select
    auth.uid() is not null
    and exists (
      select 1
      from public.store_memberships m
      where m.store_id = p_store_id
        and m.user_id = auth.uid()
        and m.role::text = any (allowed_roles)
    );
$$;

-- Automatically add the creator as owner on store insert.
create or replace function public.handle_store_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.store_memberships (store_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict (store_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_store_owner on public.stores;
create trigger trg_store_owner
after insert on public.stores
for each row
execute procedure public.handle_store_insert();

-- Categories per store.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_lowercase check (slug = lower(slug)),
  unique (store_id, slug),
  unique (store_id, id)
);
create index if not exists categories_store_idx on public.categories (store_id);

-- Products per store.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  category_id uuid not null,
  name text not null,
  slug text not null,
  description text,
  ignition_method text,
  duration_seconds integer,
  colors_available text[] not null default '{}',
  video_url text,
  image_url text,
  for_outdoor_use boolean,
  age_restriction text,
  metadata jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_slug_lowercase check (slug = lower(slug)),
  unique (store_id, slug),
  unique (store_id, id),
  constraint products_store_fk foreign key (store_id) references public.stores (id) on delete cascade,
  constraint products_category_fk foreign key (category_id, store_id) references public.categories (id, store_id) on delete cascade
);
create index if not exists products_store_idx on public.products (store_id);
create index if not exists products_category_idx on public.products (category_id);

-- Pricing tiers per product.
create table if not exists public.pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  product_id uuid not null,
  min_qty integer,
  max_qty integer,
  price numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  constraint pricing_tiers_price_nonnegative check (price >= 0),
  constraint pricing_tiers_store_fk foreign key (store_id) references public.stores (id) on delete cascade,
  constraint pricing_tiers_product_fk foreign key (product_id, store_id) references public.products (id, store_id) on delete cascade
);
create index if not exists pricing_tiers_product_idx on public.pricing_tiers (product_id);
create index if not exists pricing_tiers_store_idx on public.pricing_tiers (store_id);

-- Media metadata (store assets stored in a storage bucket).
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  bucket text not null default 'product-assets',
  object_path text not null, -- expected: "<store_id>/<filename>"
  content_type text,
  bytes bigint,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  constraint media_path_matches_store check (object_path like store_id::text || '/%'),
  unique (bucket, object_path),
  unique (store_id, object_path)
);
create index if not exists media_assets_store_idx on public.media_assets (store_id);

-- Enable RLS.
alter table public.stores enable row level security;
alter table public.store_memberships enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.pricing_tiers enable row level security;
alter table public.media_assets enable row level security;

-- Stores policies.
drop policy if exists "public can read active public stores" on public.stores;
create policy "public can read active public stores"
  on public.stores for select
  using (is_public and is_active);

drop policy if exists "members can read store" on public.stores;
create policy "members can read store"
  on public.stores for select
  using (is_store_member(id));

drop policy if exists "authenticated can create store" on public.stores;
create policy "authenticated can create store"
  on public.stores for insert
  with check (
    auth.role() = 'service_role'
    or auth.uid() = created_by
  );

drop policy if exists "owners and admins can update store" on public.stores;
create policy "owners and admins can update store"
  on public.stores for update
  using (is_store_member(id, array['owner', 'admin']))
  with check (is_store_member(id, array['owner', 'admin']));

drop policy if exists "owners can delete store" on public.stores;
create policy "owners can delete store"
  on public.stores for delete
  using (is_store_member(id, array['owner']));

-- Membership policies.
drop policy if exists "user can see their memberships" on public.store_memberships;
create policy "user can see their memberships"
  on public.store_memberships for select
  using (auth.uid() = user_id);

drop policy if exists "members can see store roster" on public.store_memberships;
-- Removed recursive roster policy to avoid stack depth loops.

drop policy if exists "store creator can bootstrap membership" on public.store_memberships;
create policy "store creator can bootstrap membership"
  on public.store_memberships for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.stores s
      where s.id = store_id
        and s.created_by = auth.uid()
    )
  );

drop policy if exists "owners and admins can add memberships" on public.store_memberships;
create policy "owners and admins can add memberships"
  on public.store_memberships for insert
  with check (is_store_member(store_id, array['owner', 'admin']));

drop policy if exists "owners and admins can update memberships" on public.store_memberships;
create policy "owners and admins can update memberships"
  on public.store_memberships for update
  using (is_store_member(store_id, array['owner', 'admin']))
  with check (is_store_member(store_id, array['owner', 'admin']));

drop policy if exists "owners and admins can delete memberships" on public.store_memberships;
create policy "owners and admins can delete memberships"
  on public.store_memberships for delete
  using (is_store_member(store_id, array['owner', 'admin']));

-- Category policies.
drop policy if exists "public can read published categories" on public.categories;
create policy "public can read published categories"
  on public.categories for select
  using (
    is_published
    and exists (
      select 1 from public.stores s
      where s.id = store_id
        and s.is_active
        and s.is_public
    )
  );

drop policy if exists "members can read categories" on public.categories;
create policy "members can read categories"
  on public.categories for select
  using (is_store_member(store_id));

drop policy if exists "editors can insert categories" on public.categories;
create policy "editors can insert categories"
  on public.categories for insert
  with check (is_store_member(store_id, array['owner', 'admin', 'editor']));

drop policy if exists "editors can update categories" on public.categories;
create policy "editors can update categories"
  on public.categories for update
  using (is_store_member(store_id, array['owner', 'admin', 'editor']))
  with check (is_store_member(store_id, array['owner', 'admin', 'editor']));

drop policy if exists "admins can delete categories" on public.categories;
create policy "admins can delete categories"
  on public.categories for delete
  using (is_store_member(store_id, array['owner', 'admin']));

-- Product policies.
drop policy if exists "public can read published products" on public.products;
create policy "public can read published products"
  on public.products for select
  using (
    is_published
    and exists (
      select 1 from public.stores s
      where s.id = store_id
        and s.is_active
        and s.is_public
    )
  );

drop policy if exists "members can read products" on public.products;
create policy "members can read products"
  on public.products for select
  using (is_store_member(store_id));

drop policy if exists "editors can insert products" on public.products;
create policy "editors can insert products"
  on public.products for insert
  with check (is_store_member(store_id, array['owner', 'admin', 'editor']));

drop policy if exists "editors can update products" on public.products;
create policy "editors can update products"
  on public.products for update
  using (is_store_member(store_id, array['owner', 'admin', 'editor']))
  with check (is_store_member(store_id, array['owner', 'admin', 'editor']));

drop policy if exists "admins can delete products" on public.products;
create policy "admins can delete products"
  on public.products for delete
  using (is_store_member(store_id, array['owner', 'admin']));

-- Pricing tier policies.
drop policy if exists "public can read pricing tiers for published products" on public.pricing_tiers;
create policy "public can read pricing tiers for published products"
  on public.pricing_tiers for select
  using (
    exists (
      select 1
      from public.products p
      join public.stores s on s.id = p.store_id
      where p.id = product_id
        and p.is_published
        and s.is_active
        and s.is_public
    )
  );

drop policy if exists "members can read pricing tiers" on public.pricing_tiers;
create policy "members can read pricing tiers"
  on public.pricing_tiers for select
  using (is_store_member(store_id));

drop policy if exists "editors can insert pricing tiers" on public.pricing_tiers;
create policy "editors can insert pricing tiers"
  on public.pricing_tiers for insert
  with check (is_store_member(store_id, array['owner', 'admin', 'editor']));

drop policy if exists "editors can update pricing tiers" on public.pricing_tiers;
create policy "editors can update pricing tiers"
  on public.pricing_tiers for update
  using (is_store_member(store_id, array['owner', 'admin', 'editor']))
  with check (is_store_member(store_id, array['owner', 'admin', 'editor']));

drop policy if exists "admins can delete pricing tiers" on public.pricing_tiers;
create policy "admins can delete pricing tiers"
  on public.pricing_tiers for delete
  using (is_store_member(store_id, array['owner', 'admin']));

-- Media metadata policies.
drop policy if exists "members can read media metadata" on public.media_assets;
create policy "members can read media metadata"
  on public.media_assets for select
  using (is_store_member(store_id));

drop policy if exists "editors can insert media metadata" on public.media_assets;
create policy "editors can insert media metadata"
  on public.media_assets for insert
  with check (is_store_member(store_id, array['owner', 'admin', 'editor']));

drop policy if exists "editors can update media metadata" on public.media_assets;
create policy "editors can update media metadata"
  on public.media_assets for update
  using (is_store_member(store_id, array['owner', 'admin', 'editor']))
  with check (is_store_member(store_id, array['owner', 'admin', 'editor']));

drop policy if exists "admins can delete media metadata" on public.media_assets;
create policy "admins can delete media metadata"
  on public.media_assets for delete
  using (is_store_member(store_id, array['owner', 'admin']));

-- Storage bucket for product assets (private by default).
insert into storage.buckets (id, name, public)
values ('product-assets', 'product-assets', false)
on conflict (id) do nothing;

-- Storage object policies: path must start with the store_id (uuid)/...
drop policy if exists "assets readable by store members" on storage.objects;
create policy "assets readable by store members"
  on storage.objects for select
  using (
    bucket_id = 'product-assets'
    and (
      auth.role() = 'service_role'
      or (
        auth.role() = 'authenticated'
        and coalesce(name, '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.+'
        and coalesce(name, '') like uuid(split_part(coalesce(name, ''), '/', 1))::text || '/%'
        and exists (
          select 1 from public.store_memberships sm
          where sm.user_id = auth.uid()
            and sm.store_id = uuid(split_part(coalesce(name, ''), '/', 1))
        )
      )
    )
  );

drop policy if exists "assets writeable by editors" on storage.objects;
create policy "assets writeable by editors"
  on storage.objects for insert
  with check (
    bucket_id = 'product-assets'
    and (
      auth.role() = 'service_role'
      or (
        auth.role() = 'authenticated'
        and coalesce(name, '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.+'
        and coalesce(name, '') like uuid(split_part(coalesce(name, ''), '/', 1))::text || '/%'
        and exists (
          select 1 from public.store_memberships sm
          where sm.user_id = auth.uid()
            and sm.store_id = uuid(split_part(coalesce(name, ''), '/', 1))
            and sm.role::text = any (array['owner', 'admin', 'editor'])
        )
      )
    )
  );

drop policy if exists "assets updateable by editors" on storage.objects;
create policy "assets updateable by editors"
  on storage.objects for update
  using (
    bucket_id = 'product-assets'
    and (
      auth.role() = 'service_role'
      or (
        auth.role() = 'authenticated'
        and coalesce(name, '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.+'
        and coalesce(name, '') like uuid(split_part(coalesce(name, ''), '/', 1))::text || '/%'
        and exists (
          select 1 from public.store_memberships sm
          where sm.user_id = auth.uid()
            and sm.store_id = uuid(split_part(coalesce(name, ''), '/', 1))
            and sm.role::text = any (array['owner', 'admin', 'editor'])
        )
      )
    )
  )
  with check (
    bucket_id = 'product-assets'
    and (
      auth.role() = 'service_role'
      or (
        auth.role() = 'authenticated'
        and coalesce(name, '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.+'
        and coalesce(name, '') like uuid(split_part(coalesce(name, ''), '/', 1))::text || '/%'
        and exists (
          select 1 from public.store_memberships sm
          where sm.user_id = auth.uid()
            and sm.store_id = uuid(split_part(coalesce(name, ''), '/', 1))
            and sm.role::text = any (array['owner', 'admin', 'editor'])
        )
      )
    )
  );

drop policy if exists "assets deletable by admins" on storage.objects;
create policy "assets deletable by admins"
  on storage.objects for delete
  using (
    bucket_id = 'product-assets'
    and (
      auth.role() = 'service_role'
      or (
        auth.role() = 'authenticated'
        and coalesce(name, '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.+'
        and coalesce(name, '') like uuid(split_part(coalesce(name, ''), '/', 1))::text || '/%'
        and exists (
          select 1 from public.store_memberships sm
          where sm.user_id = auth.uid()
            and sm.store_id = uuid(split_part(coalesce(name, ''), '/', 1))
            and sm.role::text = any (array['owner', 'admin'])
        )
      )
    )
  );
