-- =================================================================================
-- SKEMA DATABASE HAZANA BETA: AUTHENTICATION & PROFILES
-- =================================================================================

-- TABEL PROFILES
-- Tabel ini secara otomatis menghubungkan sistem login Supabase (auth.users)
-- dengan tabel buku induk (master_lembaga)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    lembaga_id UUID REFERENCES master_lembaga(lembaga_id) ON DELETE SET NULL,
    role TEXT CHECK (role IN ('ADMIN_FOZ', 'ANGGOTA_FOZ', 'GUEST')) DEFAULT 'ANGGOTA_FOZ',
    nama_lengkap TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mengaktifkan RLS untuk tabel profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Pengguna hanya boleh melihat data profilnya sendiri
CREATE POLICY "Pengguna bisa melihat profilnya sendiri"
ON profiles FOR SELECT USING (auth.uid() = id);

-- TRIGGER UNTUK MEMBUAT PROFIL OTOMATIS SAAT USER BARU DIDAFTARKAN
-- (Fungsi ini akan dijalankan otomatis oleh Supabase Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, lembaga_id, role, nama_lengkap)
  VALUES (
      new.id, 
      (new.raw_user_meta_data->>'lembaga_id')::UUID, 
      COALESCE(new.raw_user_meta_data->>'role', 'ANGGOTA_FOZ'),
      new.raw_user_meta_data->>'nama_lengkap'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger dijalankan setelah INSERT di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
