-- Create users table with Supabase auth integration
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  nama_lengkap text,
  no_telepon text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create transactions table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  jenis text not null check (jenis in ('pemasukan', 'pengeluaran')),
  nominal numeric(15,2) not null check (nominal > 0),
  kategori text not null,
  deskripsi text,
  tanggal date not null default current_date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create categories table for better organization
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  nama text not null,
  jenis text not null check (jenis in ('pemasukan', 'pengeluaran')),
  icon text,
  warna text,
  created_at timestamptz default now() not null
);

-- Create budgets table for budget tracking
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  kategori text not null,
  jumlah_target numeric(15,2) not null check (jumlah_target > 0),
  periode text not null check (periode in ('harian', 'mingguan', 'bulanan', 'tahunan')),
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint valid_date_range check (tanggal_selesai > tanggal_mulai)
);

-- Create notifications table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  judul text not null,
  pesan text not null,
  jenis text not null check (jenis in ('info', 'peringatan', 'sukses', 'error')),
  dibaca boolean default false,
  created_at timestamptz default now() not null
);

-- Enable RLS (Row Level Security)
alter table public.users enable row level security;
alter table public.transactions enable row level security;
alter table public.categories enable row level security;
alter table public.budgets enable row level security;
alter table public.notifications enable row level security;

-- Policies for users table
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Enable insert for authenticated users during registration" on public.users
  for insert with check (true);

-- Policies for transactions table
create policy "Users can view own transactions" on public.transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own transactions" on public.transactions
  for update using (auth.uid() = user_id);

create policy "Users can delete own transactions" on public.transactions
  for delete using (auth.uid() = user_id);

-- Policies for categories table (read-only for all authenticated users)
create policy "Authenticated users can view categories" on public.categories
  for select using (auth.role() = 'authenticated');

-- Policies for budgets table
create policy "Users can view own budgets" on public.budgets
  for select using (auth.uid() = user_id);

create policy "Users can insert own budgets" on public.budgets
  for insert with check (auth.uid() = user_id);

create policy "Users can update own budgets" on public.budgets
  for update using (auth.uid() = user_id);

create policy "Users can delete own budgets" on public.budgets
  for delete using (auth.uid() = user_id);

-- Policies for notifications table
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nama_lengkap, created_at, updated_at)
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data->>'nama_lengkap', ''),
    now(),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- RPC function to insert user profile (bypass RLS)
create or replace function public.insert_user_profile(
  user_id uuid,
  user_email text,
  user_nama text default '',
  user_telepon text default null
)
returns json as $$
declare
  result json;
begin
  insert into public.users (id, email, nama_lengkap, no_telepon, created_at, updated_at)
  values (user_id, user_email, user_nama, user_telepon, now(), now())
  returning json_build_object(
    'id', id,
    'email', email,
    'nama_lengkap', nama_lengkap,
    'no_telepon', no_telepon,
    'created_at', created_at,
    'updated_at', updated_at
  ) into result;
  
  return result;
end;
$$ language plpgsql security definer;

-- Function to get dashboard summary
create or replace function public.get_dashboard_summary(p_user_id uuid)
returns json as $$
declare
  total_pemasukan numeric := 0;
  total_pengeluaran numeric := 0;
  total_saldo numeric := 0;
  total_transaksi integer := 0;
  transaksi_terbaru json;
  kategori_pengeluaran json;
  result json;
begin
  -- Get total pemasukan bulan ini
  select coalesce(sum(nominal), 0) into total_pemasukan
  from public.transactions
  where user_id = p_user_id 
    and jenis = 'pemasukan'
    and date_trunc('month', tanggal) = date_trunc('month', current_date);

  -- Get total pengeluaran bulan ini
  select coalesce(sum(nominal), 0) into total_pengeluaran
  from public.transactions
  where user_id = p_user_id 
    and jenis = 'pengeluaran'
    and date_trunc('month', tanggal) = date_trunc('month', current_date);

  -- Calculate saldo
  total_saldo := total_pemasukan - total_pengeluaran;

  -- Get total transaksi bulan ini
  select count(*) into total_transaksi
  from public.transactions
  where user_id = p_user_id
    and date_trunc('month', tanggal) = date_trunc('month', current_date);

  -- Get 5 transaksi terbaru
  select json_agg(
    json_build_object(
      'id', id,
      'jenis', jenis,
      'nominal', nominal,
      'kategori', kategori,
      'deskripsi', deskripsi,
      'tanggal', tanggal,
      'created_at', created_at
    ) order by created_at desc
  ) into transaksi_terbaru
  from (
    select * from public.transactions
    where user_id = p_user_id
    order by created_at desc
    limit 5
  ) t;

  -- Get kategori pengeluaran dengan total
  select json_object_agg(kategori, total_nominal) into kategori_pengeluaran
  from (
    select kategori, sum(nominal) as total_nominal
    from public.transactions
    where user_id = p_user_id 
      and jenis = 'pengeluaran'
      and date_trunc('month', tanggal) = date_trunc('month', current_date)
    group by kategori
    order by total_nominal desc
    limit 10
  ) k;

  -- Build final result
  result := json_build_object(
    'saldo', total_saldo,
    'pemasukan', total_pemasukan,
    'pengeluaran', total_pengeluaran,
    'transaksi', total_transaksi,
    'transaksiTerbaru', coalesce(transaksi_terbaru, '[]'::json),
    'kategoriPengeluaran', coalesce(kategori_pengeluaran, '{}'::json)
  );

  return result;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger to automatically create user profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert default categories
insert into public.categories (nama, jenis, icon, warna) values
-- Kategori Pemasukan
('Gaji', 'pemasukan', '💰', '#10B981'),
('Freelance', 'pemasukan', '💻', '#059669'),
('Investasi', 'pemasukan', '📈', '#047857'),
('Bonus', 'pemasukan', '🎁', '#065F46'),
('Lainnya', 'pemasukan', '💵', '#064E3B'),

-- Kategori Pengeluaran
('Makanan', 'pengeluaran', '🍕', '#EF4444'),
('Transportasi', 'pengeluaran', '🚗', '#F97316'),
('Belanja', 'pengeluaran', '🛒', '#8B5CF6'),
('Hiburan', 'pengeluaran', '🎬', '#EC4899'),
('Kesehatan', 'pengeluaran', '🏥', '#06B6D4'),
('Pendidikan', 'pengeluaran', '📚', '#3B82F6'),
('Tagihan', 'pengeluaran', '📋', '#6B7280'),
('Lainnya', 'pengeluaran', '💸', '#9CA3AF');

-- Create indexes for better performance
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_tanggal on public.transactions(tanggal);
create index idx_transactions_jenis on public.transactions(jenis);
create index idx_transactions_user_date on public.transactions(user_id, tanggal);
create index idx_budgets_user_id on public.budgets(user_id);
create index idx_notifications_user_id on public.notifications(user_id);