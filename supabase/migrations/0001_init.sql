-- Wedding planner schema. Auth comes from Clerk (Supabase third-party auth),
-- so the user id is the Clerk user id in auth.jwt()->>'sub' (text, not uuid).

create extension if not exists pgcrypto;

create or replace function public.clerk_uid() returns text
language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '') $$;

-- ---------------------------------------------------------------- tables

create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  partner_a text not null default '',
  partner_b text not null default '',
  wedding_date date,
  city text not null default '',
  total_budget bigint not null default 0 check (total_budget >= 0),
  guest_target int not null default 0 check (guest_target >= 0),
  pax_per_invite numeric(3, 1) not null default 2,
  catering_buffer_pct int not null default 10 check (catering_buffer_pct between 0 and 100),
  contingency_pct int not null default 10 check (contingency_pct between 0 and 50),
  ceremonies text[] not null default '{}',
  created_by text not null default public.clerk_uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wedding_members (
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id text not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  display_name text not null default '',
  email text not null default '',
  joined_at timestamptz not null default now(),
  primary key (wedding_id, user_id)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  label text not null default '',
  expires_at timestamptz not null default now() + interval '14 days',
  revoked boolean not null default false,
  created_by text not null default public.clerk_uid(),
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  kind text not null default 'lainnya',
  side text not null default 'bersama' check (side in ('pria', 'wanita', 'bersama')),
  date date,
  start_time text not null default '',
  venue text not null default '',
  notes text not null default '',
  sort int not null default 0,
  created_by text not null default public.clerk_uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  icon text not null default 'wallet',
  allocated bigint not null default 0 check (allocated >= 0),
  notes text not null default '',
  sort int not null default 0,
  created_by text not null default public.clerk_uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category_id uuid references public.budget_categories (id) on delete set null,
  name text not null,
  contact_name text not null default '',
  phone text not null default '',
  instagram text not null default '',
  status text not null default 'survei' check (status in ('survei', 'negosiasi', 'deal', 'batal')),
  contract_total bigint not null default 0 check (contract_total >= 0),
  notes text not null default '',
  created_by text not null default public.clerk_uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category_id uuid not null references public.budget_categories (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,
  vendor_id uuid references public.vendors (id) on delete set null,
  name text not null,
  estimated bigint not null default 0 check (estimated >= 0),
  actual bigint check (actual >= 0),
  notes text not null default '',
  sort int not null default 0,
  created_by text not null default public.clerk_uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  vendor_id uuid references public.vendors (id) on delete cascade,
  category_id uuid references public.budget_categories (id) on delete set null,
  label text not null,
  amount bigint not null default 0 check (amount >= 0),
  due_date date,
  paid_at date,
  method text not null default '',
  notes text not null default '',
  created_by text not null default public.clerk_uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  side text not null default 'bersama' check (side in ('pria', 'wanita', 'bersama')),
  group_name text not null default '',
  pax int not null default 2 check (pax between 1 and 50),
  phone text not null default '',
  invite_type text not null default 'digital' check (invite_type in ('cetak', 'digital')),
  invite_sent boolean not null default false,
  rsvp text not null default 'belum' check (rsvp in ('belum', 'hadir', 'mungkin', 'tidak')),
  events text[] not null default '{}',
  gift_amount bigint check (gift_amount >= 0),
  gift_channel text not null default '' check (gift_channel in ('', 'tunai', 'transfer', 'kado')),
  notes text not null default '',
  created_by text not null default public.clerk_uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  phase text not null default 'lainnya',
  category text not null default '',
  due_date date,
  assignee text not null default '',
  done boolean not null default false,
  done_at timestamptz,
  notes text not null default '',
  sort int not null default 0,
  created_by text not null default public.clerk_uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.wedding_members (user_id);
create index on public.events (wedding_id);
create index on public.budget_categories (wedding_id);
create index on public.budget_items (wedding_id);
create index on public.vendors (wedding_id);
create index on public.payments (wedding_id);
create index on public.guests (wedding_id);
create index on public.tasks (wedding_id);

-- ------------------------------------------------------------ updated_at

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['weddings', 'events', 'budget_categories', 'vendors', 'budget_items', 'payments', 'guests', 'tasks']
  loop
    execute format('create trigger touch before update on public.%I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ------------------------------------------------------------------- RLS

create or replace function public.my_role(w uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from public.wedding_members where wedding_id = w and user_id = public.clerk_uid()
$$;

alter table public.weddings enable row level security;
alter table public.wedding_members enable row level security;
alter table public.invites enable row level security;

create policy "members read wedding" on public.weddings for select using (public.my_role(id) is not null);
create policy "editors update wedding" on public.weddings for update using (public.my_role(id) in ('owner', 'editor'));
create policy "owner deletes wedding" on public.weddings for delete using (public.my_role(id) = 'owner');

create policy "members read members" on public.wedding_members for select using (public.my_role(wedding_id) is not null);
create policy "owner changes roles" on public.wedding_members for update
  using (public.my_role(wedding_id) = 'owner') with check (role in ('editor', 'viewer', 'owner'));
create policy "owner removes, member leaves" on public.wedding_members for delete
  using (role <> 'owner' and (public.my_role(wedding_id) = 'owner' or user_id = public.clerk_uid()));

create policy "owner manages invites" on public.invites for all
  using (public.my_role(wedding_id) = 'owner') with check (public.my_role(wedding_id) = 'owner');

do $$
declare t text;
begin
  foreach t in array array['events', 'budget_categories', 'vendors', 'budget_items', 'payments', 'guests', 'tasks']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "members read" on public.%I for select using (public.my_role(wedding_id) is not null)', t);
    execute format('create policy "editors insert" on public.%I for insert with check (public.my_role(wedding_id) in (''owner'', ''editor''))', t);
    execute format('create policy "editors update" on public.%I for update using (public.my_role(wedding_id) in (''owner'', ''editor''))', t);
    execute format('create policy "editors delete" on public.%I for delete using (public.my_role(wedding_id) in (''owner'', ''editor''))', t);
  end loop;
end $$;

-- ------------------------------------------------------------------ RPCs

create or replace function public.create_wedding(p jsonb, p_display_name text, p_email text)
returns public.weddings
language plpgsql security definer set search_path = public as $$
declare
  uid text := public.clerk_uid();
  w public.weddings;
begin
  if uid is null then raise exception 'not signed in'; end if;
  insert into public.weddings (name, partner_a, partner_b, wedding_date, city, total_budget, guest_target, ceremonies, created_by)
  values (
    coalesce(nullif(p ->> 'name', ''), 'Pernikahan kami'),
    coalesce(p ->> 'partner_a', ''),
    coalesce(p ->> 'partner_b', ''),
    nullif(p ->> 'wedding_date', '')::date,
    coalesce(p ->> 'city', ''),
    coalesce((p ->> 'total_budget')::bigint, 0),
    coalesce((p ->> 'guest_target')::int, 0),
    coalesce(array(select jsonb_array_elements_text(p -> 'ceremonies')), '{}'),
    uid
  ) returning * into w;
  insert into public.wedding_members (wedding_id, user_id, role, display_name, email)
  values (w.id, uid, 'owner', coalesce(p_display_name, ''), coalesce(p_email, ''));
  return w;
end $$;

create or replace function public.accept_invite(p_code text, p_display_name text, p_email text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid text := public.clerk_uid();
  inv public.invites;
begin
  if uid is null then raise exception 'not signed in'; end if;
  select * into inv from public.invites
   where code = upper(trim(p_code)) and not revoked and expires_at > now();
  if inv.id is null then raise exception 'invite invalid or expired'; end if;
  insert into public.wedding_members (wedding_id, user_id, role, display_name, email)
  values (inv.wedding_id, uid, inv.role, coalesce(p_display_name, ''), coalesce(p_email, ''))
  on conflict (wedding_id, user_id) do nothing;
  return inv.wedding_id;
end $$;

revoke all on function public.create_wedding(jsonb, text, text) from public, anon;
revoke all on function public.accept_invite(text, text, text) from public, anon;
grant execute on function public.create_wedding(jsonb, text, text) to authenticated;
grant execute on function public.accept_invite(text, text, text) to authenticated;

-- ------------------------------------------------------------- realtime

alter publication supabase_realtime add table
  public.weddings, public.wedding_members, public.events, public.budget_categories,
  public.vendors, public.budget_items, public.payments, public.guests, public.tasks;
