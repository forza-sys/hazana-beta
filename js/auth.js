/**
 * HAZANA BETA Authentication & Session Manager
 * Menggunakan Supabase Auth + Verifikasi Anggota FOZ
 */

const HazanaAuth = {

    PUBLIC_PAGES: ['login.html', 'index.html'],

    ROLE_PATHS: {
        'SUPER_ADMIN': 'admin/dashboard.html',
        'TIM_SEKRETARIAT': 'sekretariat/dashboard.html',
        'EXECUTIVE_FOZ': 'executive/dashboard.html',
        'ANGGOTA_FOZ': 'member/dashboard.html',
        'UNIT_LAYANAN_1': 'unit-layanan-1/iuran-anggota.html',
        'UNIT_LAYANAN_2': 'sekretariat/dashboard.html',
        'PENGURUS': 'sekretariat/dashboard.html',
        'PENGURUS_HARIAN': 'sekretariat/dashboard.html',
        'BIDANG': 'sekretariat/dashboard.html',
        'DIREKTUR_EKSEKUTIF': 'sekretariat/dashboard.html',
        'GUEST': 'index.html'
    },

    async login(email, password) {
        if (!supabaseClient) {
            return { success: false, error: 'Koneksi ke server gagal. Coba lagi.' };
        }

        // 1. Autentikasi dengan Supabase
        const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (authError) {
            console.error('[HazanaAuth] Login error:', authError.message);
            return { success: false, error: 'Email atau password salah.' };
        }

        const userId = authData.user.id;

        // 2. Ambil Profil & Verifikasi Status Keanggotaan FOZ
        const profile = await this._fetchProfileWithMembership(userId);
        
        if (!profile) {
            await supabaseClient.auth.signOut();
            return { success: false, error: 'Profil tidak ditemukan. Hubungi administrator.' };
        }

        if (!profile.is_active) {
            await supabaseClient.auth.signOut();
            return { success: false, error: 'Akun Anda sedang dinonaktifkan.' };
        }

        // 3. BLOKIR JIKA BUKAN ANGGOTA FOZ (Kecuali Super Admin)
        if (profile.role !== 'SUPER_ADMIN' && profile.master_lembaga && profile.master_lembaga.is_foz_member === false) {
            await supabaseClient.auth.signOut();
            return { success: false, error: 'Akses ditolak. Lembaga Anda terdaftar, namun belum berstatus Anggota FOZ.' };
        }

        const user = { ...authData.user, ...profile };
        return { success: true, user, role: profile.role };
    },

    async _fetchProfileWithMembership(userId) {
        // Lakukan join table antara profiles dan master_lembaga
        const { data, error } = await supabaseClient
            .from('profiles')
            .select(`
                role,
                nama_lengkap,
                is_active,
                lembaga_id,
                master_lembaga (
                    nama_lembaga,
                    nama_singkat,
                    tipe_lembaga,
                    is_foz_member
                )
            `)
            .eq('id', userId)
            .single();

        if (error || !data) {
            console.error('[HazanaAuth] Fetch profile error:', error?.message);
            return null;
        }

        return data;
    },

    async getSession() {
        if (!supabaseClient) return null;

        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return null;

        const profile = await this._fetchProfileWithMembership(session.user.id);
        if (!profile) return null;

        // Validasi lagi jika tiba-tiba status keanggotaan dicabut saat sesi masih aktif (Kecuali Super Admin)
        if (profile.role !== 'SUPER_ADMIN' && profile.master_lembaga && profile.master_lembaga.is_foz_member === false) {
            await this.logout();
            return null;
        }

        return { ...session.user, ...profile };
    },

    async logout() {
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        this._redirectToLogin();
    },

    async guard() {
        const user = await this.getSession();
        if (!user) {
            this._redirectToLogin();
            return null;
        }
        return user;
    },

    async guardRole(allowedRoles) {
        const user = await this.guard();
        if (!user) return null;

        if (!allowedRoles.includes(user.role)) {
            window.location.href = this.getRedirectPath(user.role);
            return null;
        }

        return user;
    },

    getRedirectPath(role) {
        const isSubFolder = window.location.pathname.split('/').some(p =>
            ['admin', 'member', 'sekretariat', 'executive', 'unit-layanan-1'].includes(p)
        );
        const base = isSubFolder ? '../' : './';
        return base + (this.ROLE_PATHS[role] || 'index.html');
    },

    _redirectToLogin() {
        const isSubFolder = window.location.pathname.split('/').some(p =>
            ['admin', 'member', 'sekretariat', 'executive', 'unit-layanan-1'].includes(p)
        );
        window.location.href = isSubFolder ? '../login.html' : 'login.html';
    },

    async init() {
        const pathname = window.location.pathname;
        const isPublic = this.PUBLIC_PAGES.some(p => pathname.endsWith(p)) || pathname.endsWith('/');

        if (isPublic) return;

        const user = await this.guard();
        if (user) {
            window.HAZANA_USER = user;
            window.dispatchEvent(new CustomEvent('hazana:user-ready', { detail: user }));
        }
    }
};

HazanaAuth.init();
