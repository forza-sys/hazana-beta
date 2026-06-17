-- =================================================================================
-- SKEMA DATABASE HAZANA BETA: MASTER DATA MANAGEMENT (MDM)
-- =================================================================================

-- 1. TABEL UTAMA: MASTER LEMBAGA
-- Tabel ini adalah "Buku Induk". Semua LAZ di Indonesia (Anggota FOZ maupun bukan)
-- harus masuk ke sini agar datanya bisa dihitung di dashboard nasional.
CREATE TABLE master_lembaga (
    lembaga_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama_lembaga TEXT NOT NULL,
    nama_singkat TEXT, -- Contoh: "DD", "RZ" (Digunakan untuk Search UI)
    jenis_lembaga TEXT CHECK (jenis_lembaga IN ('BAZ', 'LAZ', 'UPZ', 'MPZ', 'NON_OPZ')),
    kategori_institusi TEXT DEFAULT 'ZISWAF' CHECK (kategori_institusi IN ('ZISWAF', 'NON_PROFIT')),
    tipe_lembaga TEXT CHECK (tipe_lembaga IN ('Nasional', 'Provinsi', 'Kab/Kota')) NOT NULL,
    sk_kemenag TEXT, -- Nomor SK Kemenag
    is_foz_member BOOLEAN DEFAULT FALSE, -- Penentu apakah bisa dibuatkan User ID (Akses Login) atau tidak
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABEL KAMUS NAMA: LEMBAGA ALIASES
-- Tabel ini merekam semua variasi nama dari Excel (BAZNAS, SIMZAT, FOZ).
-- Jika ada upload Excel, skrip akan mengecek tabel ini dulu.
CREATE TABLE lembaga_aliases (
    alias_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lembaga_id UUID REFERENCES master_lembaga(lembaga_id) ON DELETE CASCADE,
    raw_name TEXT NOT NULL, -- Contoh: "Yayasan Dompet Dhuafa Republika"
    source TEXT CHECK (source IN ('BAZNAS', 'SIMZAT', 'FOZ', 'MANUAL_ENTRY')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(raw_name, source) -- Tidak boleh ada duplikasi variasi nama dari sumber yang sama
);

-- 3. TABEL DATA: AGREGAT LAPORAN ZIS
-- Tabel ini menampung triliunan rupiah uang ZIS. Data bisa berasal dari 
-- API SIMZAT, Excel BAZNAS, atau Input Manual Anggota FOZ.
CREATE TABLE agregat_laporan_zis (
    laporan_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lembaga_id UUID REFERENCES master_lembaga(lembaga_id) ON DELETE CASCADE,
    tahun INTEGER NOT NULL,
    bulan INTEGER NOT NULL CHECK (bulan BETWEEN 1 AND 12),
    total_penghimpunan NUMERIC DEFAULT 0,
    total_penyaluran NUMERIC DEFAULT 0,
    sumber_data TEXT CHECK (sumber_data IN ('SIMZAT', 'BAZNAS', 'FOZ_SELF_REPORT')) NOT NULL,
    status_verifikasi TEXT DEFAULT 'DRAFT' CHECK (status_verifikasi IN ('DRAFT', 'VERIFIED', 'QUARANTINE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================================
-- PENGATURAN KEAMANAN (ROW LEVEL SECURITY - RLS)
-- =================================================================================

-- Aktifkan satpam RLS
ALTER TABLE master_lembaga ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembaga_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE agregat_laporan_zis ENABLE ROW LEVEL SECURITY;

-- RULE 1: Publik (Hazana Hub) boleh melihat seluruh profil lembaga secara anonim
CREATE POLICY "Publik bisa melihat data master lembaga"
ON master_lembaga FOR SELECT USING (true);

-- RULE 2: Publik (Hazana Hub) boleh melihat data laporan ZIS YANG SUDAH DIVERIFIKASI saja
CREATE POLICY "Publik bisa melihat laporan ZIS verified"
ON agregat_laporan_zis FOR SELECT USING (status_verifikasi = 'VERIFIED');

-- RULE 3: Anggota FOZ (Hazana Beta) hanya boleh MENGEDIT data laporannya sendiri
-- (Catatan: Auth.uid() akan dikaitkan dengan lembaga_id di tabel `profiles` nantinya)
CREATE POLICY "Anggota FOZ hanya bisa edit data laporannya sendiri"
ON agregat_laporan_zis FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM master_lembaga ml 
        -- Pengecekan ini nanti disesuaikan saat tabel auth `profiles` sudah dibuat
        WHERE ml.lembaga_id = agregat_laporan_zis.lembaga_id
        AND ml.is_foz_member = true
    )
);

-- RULE 4: Admin FOZ memiliki akses penuh (SELECT, INSERT, UPDATE, DELETE)
-- ke tabel lembaga_aliases untuk melakukan "Mapping/Karantina" secara manual.
-- (Policy Admin ini akan disempurnakan di script autentikasi berikutnya).
