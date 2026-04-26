-- ============================================================
-- SIMULACRA — Supabase Migration SQL
-- Jalankan di: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Tambah kolom 'role' ke user_profiles
--    Nilai: 'siswa_sma' | 'mahasiswa' | 'pekerja'
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT 
  CHECK (role IN ('siswa_sma', 'mahasiswa', 'pekerja'))
  DEFAULT 'mahasiswa';

-- 2. Tambah kolom 'target_roles' ke categories
--    Array role yang dapat melihat kategori ini
--    Default: semua role dapat melihat
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS target_roles TEXT[] 
  DEFAULT ARRAY['siswa_sma', 'mahasiswa', 'pekerja'];

-- 3. Update sessions untuk tracking lengkap
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS avg_response_time FLOAT,
ADD COLUMN IF NOT EXISTS total_exchanges INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_start TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS session_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS patience_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS clarity_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS input_mode TEXT DEFAULT 'text';

-- 4. (Opsional) Update kategori existing dengan target_roles yang spesifik
--    Sesuaikan berdasarkan title kategori yang ada di database kamu
--    Uncomment dan edit sesuai kebutuhan:

-- UPDATE categories SET target_roles = ARRAY['mahasiswa', 'pekerja']
--   WHERE title ILIKE '%wawancara%' OR title ILIKE '%kerja%';

-- UPDATE categories SET target_roles = ARRAY['mahasiswa']
--   WHERE title ILIKE '%skripsi%' OR title ILIKE '%sidang%';

-- UPDATE categories SET target_roles = ARRAY['siswa_sma']
--   WHERE title ILIKE '%osis%' OR title ILIKE '%sekolah%';

-- UPDATE categories SET target_roles = ARRAY['pekerja']
--   WHERE title ILIKE '%klien%' OR title ILIKE '%negosiasi%' OR title ILIKE '%manajemen%';

-- 5. Enable RLS policies (jika belum ada) — opsional
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "user_sessions" ON sessions
--   FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- VERIFIKASI: Jalankan query ini untuk cek hasilnya
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns 
--   WHERE table_name = 'user_profiles' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns 
--   WHERE table_name = 'sessions' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns 
--   WHERE table_name = 'categories' ORDER BY ordinal_position;
