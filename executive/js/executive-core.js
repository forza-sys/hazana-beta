/**
 * Core JS untuk Admin Dashboard HAZANA BETA
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Pastikan user sudah diload oleh auth.js
    if (!window.HAZANA_USER) {
        // Coba tunggu sebentar
        window.addEventListener('hazana:user-ready', initAdmin);
    } else {
        initAdmin();
    }
});

async function initAdmin() {
    const user = window.HAZANA_USER;
    
    // Set UI Profil
    document.getElementById('user-name').textContent = user.nama_lengkap || user.email;
    document.getElementById('user-role').textContent = user.role.replace('_', ' ');

    const currentPath = window.location.pathname;

    // Load data sesuai halaman
    if (currentPath.includes('dashboard.html')) {
        await loadDashboardStats();
        await loadRecentLembaga();
    } else if (currentPath.includes('data-karantina.html')) {
        await loadKarantinaData();
    }

    // Selalu load badge karantina di semua halaman admin
    await updateQuarantineBadge();
}

// ==========================================
// FUNGSI DASHBOARD UTAMA
// ==========================================

async function loadDashboardStats() {
    try {
        // Count master lembaga
        const { count: countLembaga, error: err1 } = await supabaseClient
            .from('master_lembaga')
            .select('*', { count: 'exact', head: true });
            
        if (!err1) document.getElementById('stat-lembaga').textContent = countLembaga;

        // Count Karantina (Simulasi dari tabel agregat_laporan_zis yg statusnya QUARANTINE atau raw names unmapped)
        // Untuk tahap awal, kita akan asumsikan data karantina ada di lembaga_aliases dgn lembaga_id NULL (unmapped)
        const { count: countKarantina, error: err2 } = await supabaseClient
            .from('lembaga_aliases')
            .select('*', { count: 'exact', head: true })
            .is('lembaga_id', null);
            
        if (!err2) document.getElementById('stat-karantina').textContent = countKarantina;
    } catch (e) {
        console.error("Gagal load stats:", e);
    }
}

async function loadRecentLembaga() {
    const tbody = document.getElementById('lembaga-table-body');
    const { data, error } = await supabaseClient
        .from('master_lembaga')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #64748b;">Belum ada data lembaga terdaftar.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(l => {
        const badgeFoz = l.is_foz_member 
            ? '<span class="badge badge-success">Anggota FOZ</span>' 
            : '<span class="badge badge-warning">Non-Anggota</span>';
            
        tbody.innerHTML += `
            <tr>
                <td><strong>${l.nama_lembaga}</strong> <br> <span style="font-size: 0.75rem; color: var(--text-muted);">${l.nama_singkat || '-'}</span></td>
                <td><span class="badge" style="background:#e2e8f0;">${l.tipe_lembaga}</span></td>
                <td>${badgeFoz}</td>
                <td><button class="btn btn-outline btn-sm">Lihat Detail</button></td>
            </tr>
        `;
    });
}

// ==========================================
// FUNGSI KARANTINA DATA (MAPPING)
// ==========================================

async function loadKarantinaData() {
    const tbody = document.getElementById('karantina-table-body');
    
    // Ambil data yang belum dipetakan (lembaga_id IS NULL)
    const { data, error } = await supabaseClient
        .from('lembaga_aliases')
        .select('*')
        .is('lembaga_id', null)
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Tidak ada data di karantina. Semua bersih! ✨</td></tr>';
        return;
    }

    // Ambil daftar Master Lembaga untuk opsi Dropdown
    const { data: masters } = await supabaseClient
        .from('master_lembaga')
        .select('lembaga_id, nama_lembaga')
        .order('nama_lembaga', { ascending: true });

    let optionsHTML = '<option value="">-- Pilih Lembaga Induk --</option>';
    if (masters) {
        masters.forEach(m => {
            optionsHTML += `<option value="${m.lembaga_id}">${m.nama_lembaga}</option>`;
        });
    }

    tbody.innerHTML = '';
    data.forEach(item => {
        tbody.innerHTML += `
            <tr id="row-${item.alias_id}">
                <td style="font-weight: 600; color: var(--danger);">${item.raw_name}</td>
                <td><span class="badge badge-warning">${item.source}</span></td>
                <td>
                    <select class="mapping-select" id="select-${item.alias_id}">
                        ${optionsHTML}
                    </select>
                </td>
                <td class="row-action">
                    <button class="btn btn-primary btn-sm" onclick="saveMapping('${item.alias_id}')"><i class="fas fa-check"></i> Simpan</button>
                    <button class="btn btn-outline btn-sm" onclick="deleteAlias('${item.alias_id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

async function saveMapping(aliasId) {
    const select = document.getElementById(`select-${aliasId}`);
    const lembagaId = select.value;

    if (!lembagaId) {
        alert("Pilih lembaga induk terlebih dahulu!");
        return;
    }

    const btn = select.parentElement.nextElementSibling.querySelector('.btn-primary');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const { error } = await supabaseClient
        .from('lembaga_aliases')
        .update({ lembaga_id: lembagaId })
        .eq('alias_id', aliasId);

    if (error) {
        alert("Gagal menyimpan mapping: " + error.message);
        btn.innerHTML = '<i class="fas fa-check"></i> Simpan';
    } else {
        // Hilangkan baris dari tabel dengan animasi
        const row = document.getElementById(`row-${aliasId}`);
        row.style.opacity = '0';
        row.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            row.remove();
            updateQuarantineBadge();
            if (document.getElementById('karantina-table-body').children.length === 0) {
                document.getElementById('karantina-table-body').innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">Tidak ada data di karantina. Semua bersih! ✨</td></tr>';
            }
        }, 500);
    }
}

async function deleteAlias(aliasId) {
    if(!confirm("Yakin ingin menghapus nama asing ini selamanya?")) return;
    
    await supabaseClient.from('lembaga_aliases').delete().eq('alias_id', aliasId);
    document.getElementById(`row-${aliasId}`).remove();
    updateQuarantineBadge();
}

async function updateQuarantineBadge() {
    const { count } = await supabaseClient
        .from('lembaga_aliases')
        .select('*', { count: 'exact', head: true })
        .is('lembaga_id', null);
        
    const badges = document.querySelectorAll('#quarantine-badge');
    badges.forEach(b => {
        b.textContent = count || '0';
        if(count > 0) b.style.display = 'inline-block';
        else b.style.display = 'none';
    });
}

// Fungsi dummy untuk mendemonstrasikan munculnya data karantina (Untuk presentasi)
window.simulateUpload = async function() {
    const dummyData = [
        { raw_name: 'Yayasan DD Republika', source: 'BAZNAS' },
        { raw_name: 'Rumah Zakat Indonesia', source: 'SIMZAT' },
        { raw_name: 'LAZ BSM Umat', source: 'BAZNAS' }
    ];
    
    for(const d of dummyData) {
        await supabaseClient.from('lembaga_aliases').insert([d]);
    }
    
    alert("Simulasi berhasil! 3 data asing baru masuk dari Excel BAZNAS/SIMZAT.");
    window.location.reload();
}
