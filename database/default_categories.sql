-- Script untuk menambahkan kategori default SmartSaku
-- Jalankan di Supabase SQL Editor

-- Insert default categories untuk pengeluaran
INSERT INTO public.categories (nama, jenis, icon, warna) VALUES
  ('Makanan & Minuman', 'pengeluaran', 'fas fa-utensils', '#ef4444'),
  ('Transport', 'pengeluaran', 'fas fa-bus', '#3b82f6'),
  ('Hiburan', 'pengeluaran', 'fas fa-gamepad', '#8b5cf6'),
  ('Pendidikan', 'pengeluaran', 'fas fa-graduation-cap', '#059669'),
  ('Kesehatan', 'pengeluaran', 'fas fa-heartbeat', '#dc2626'),
  ('Belanja', 'pengeluaran', 'fas fa-shopping-bag', '#7c3aed'),
  ('Tagihan', 'pengeluaran', 'fas fa-file-invoice', '#b91c1c'),
  ('Lainnya', 'pengeluaran', 'fas fa-ellipsis-h', '#6b7280');

-- Insert default categories untuk pemasukan
INSERT INTO public.categories (nama, jenis, icon, warna) VALUES
  ('Uang Saku', 'pemasukan', 'fas fa-hand-holding-usd', '#10b981'),
  ('Kerja Partime', 'pemasukan', 'fas fa-briefcase', '#059669'),
  ('Freelance', 'pemasukan', 'fas fa-laptop-code', '#0d9488'),
  ('Hadiah', 'pemasukan', 'fas fa-gift', '#06b6d4'),
  ('Beasiswa', 'pemasukan', 'fas fa-award', '#0ea5e9'),
  ('Lainnya', 'pemasukan', 'fas fa-plus-circle', '#22c55e');

-- Verify categories were inserted
SELECT * FROM public.categories ORDER BY jenis, nama;