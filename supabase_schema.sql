-- =========================================================================
-- Personal Accounting System - Supabase Clean Setup
-- Copy and run this ENTIRE script in Supabase SQL Editor
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables to avoid any duplicate column or conflict errors
drop table if exists public.payments cascade;
drop table if exists public.transactions cascade;
drop table if exists public.dealers cascade;
drop table if exists public.app_users cascade;

-- 1. APP USERS TABLE (Phone & Password Login)
create table public.app_users (
    id uuid primary key default gen_random_uuid(),
    phone text unique not null,
    password text not null,
    name text not null,
    role text default 'admin',
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. WALLETS TABLE (formerly dealers)
create table public.dealers (
    id uuid primary key default gen_random_uuid(),
    wallet_number text not null,
    notes text,
    name text default '',
    dealer_number text default '',
    phone text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TRANSACTIONS TABLE (Daily accounting entries)
create table public.transactions (
    id uuid primary key default gen_random_uuid(),
    dealer_id uuid not null references public.dealers(id) on delete cascade,
    amount numeric(14, 2) not null check (amount > 0),
    date date not null default current_date,
    notes text,
    description text,
    reference_no text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. PAYMENTS TABLE (Dealer payments received)
create table public.payments (
    id uuid primary key default gen_random_uuid(),
    dealer_id uuid not null references public.dealers(id) on delete cascade,
    amount numeric(14, 2) not null check (amount > 0),
    date date not null default current_date,
    payment_method text default 'Wallet',
    reference_no text,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INDEXES
create index idx_app_users_phone on public.app_users(phone);
create index idx_dealers_number on public.dealers(dealer_number);
create index idx_transactions_dealer_id on public.transactions(dealer_id);
create index idx_transactions_date on public.transactions(date);
create index idx_payments_dealer_id on public.payments(dealer_id);
create index idx_payments_date on public.payments(date);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.app_users enable row level security;
alter table public.dealers enable row level security;
alter table public.transactions enable row level security;
alter table public.payments enable row level security;

create policy "Enable all access for app_users" on public.app_users
    for all using (true) with check (true);

create policy "Enable all access for dealers" on public.dealers
    for all using (true) with check (true);

create policy "Enable all access for transactions" on public.transactions
    for all using (true) with check (true);

create policy "Enable all access for payments" on public.payments
    for all using (true) with check (true);

-- INITIAL ADMIN ACCOUNT
insert into public.app_users (phone, password, name, role)
values ('01700000000', '123456', 'System Admin', 'admin');
