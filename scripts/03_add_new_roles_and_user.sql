-- =================================================================================
-- SCRIPT UPDATE: Menambahkan Role Baru & Akun Unit Layanan 1
-- Jalankan kode ini di SQL Editor Supabase Anda
-- =================================================================================

-- 1. HAPUS CONSTRAINT ROLE YANG LAMA
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. TAMBAHKAN CONSTRAINT ROLE YANG BARU
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
    'SUPER_ADMIN', 
    'ANGGOTA_FOZ', 
    'GUEST', 
    'TIM_SEKRETARIAT', 
    'EXECUTIVE_FOZ', 
    'UNIT_LAYANAN_1', 
    'UNIT_LAYANAN_2', 
    'PENGURUS', 
    'PENGURUS_HARIAN', 
    'BIDANG', 
    'DIREKTUR_EKSEKUTIF'
));

-- =================================================================================
-- 3. BUAT AKUN UNIT LAYANAN 1 (ul1@forumzakat.org)
-- CATATAN: auth.users sebaiknya dibuat dari aplikasi (sign up).
-- Jika belum mendaftar, silakan daftar dulu via aplikasi.
-- Jika sudah, script ini akan memastikan rolenya diset dengan benar.
-- =================================================================================

-- JIKA ANDA INGIN MEMBUAT AKUN LANGSUNG VIA SQL (Bypass Supabase Auth UI):
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'ul1@forumzakat.org',
    crypt('password123', gen_salt('bf')), -- Default password: password123
    NOW(),
    '{"nama_lengkap":"Admin Unit Layanan 1", "role":"UNIT_LAYANAN_1"}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- TRIGGER "handle_new_user" otomatis akan memasukkan data ke tabel "profiles" 
-- berdasarkan "raw_user_meta_data" di atas.
