document.addEventListener('DOMContentLoaded', async () => {
    if (!window.HAZANA_USER) {
        window.addEventListener('hazana:user-ready', initSekretariat);
    } else {
        initSekretariat();
    }
});

async function initSekretariat() {
    const user = window.HAZANA_USER;
    if (user.role !== 'TIM_SEKRETARIAT' && user.role !== 'SUPER_ADMIN') {
        window.location.href = '../index.html';
        return;
    }
    
    document.getElementById('user-name').textContent = user.nama_lengkap || user.email;
    document.getElementById('user-role').textContent = user.role.replace('_', ' ');

    await loadLembagaData();
}

async function loadLembagaData() {
    try {
        const { data, error } = await supabaseClient
            .from('lembaga_zakat')
            .select('*')
            .order('nama_lembaga', { ascending: true });
            
        if (error) {
            console.error("Error fetching lembaga:", error);
            if(error.code === '42P01') {
                document.getElementById('lembaga-table-body').innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">Tabel lembaga_zakat belum dibuat di Supabase.</td></tr>`;
                return;
            }
            throw error;
        }
        
        let total = data.length;
        let anggota = data.filter(d => d.is_anggota_foz).length;
        let nonAnggota = total - anggota;
        
        document.getElementById('stat-total-lembaga').textContent = total;
        document.getElementById('stat-anggota-foz').textContent = anggota;
        document.getElementById('stat-non-anggota').textContent = nonAnggota;
        
        renderLembagaTable(data);
    } catch (e) {
        console.error("Gagal load lembaga:", e);
        document.getElementById('lembaga-table-body').innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: red;">Gagal memuat data lembaga.</td></tr>`;
    }
}

function renderLembagaTable(data) {
    const tbody = document.getElementById('lembaga-table-body');
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">Belum ada data lembaga terdaftar di Master Database.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>
                <div style="font-weight: 700; color: var(--text-main);">${item.nama_lembaga}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">SK: ${item.sk_kemenag || '-'}</div>
            </td>
            <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${item.tingkat}</span></td>
            <td>${item.provinsi}</td>
            <td id="status-col-${item.id}">
                ${item.is_anggota_foz 
                    ? '<span class="badge badge-success"><i class="fas fa-check-circle" style="margin-right: 4px;"></i> Anggota FOZ</span>' 
                    : '<span class="badge badge-warning"><i class="fas fa-clock" style="margin-right: 4px;"></i> Belum Anggota</span>'}
            </td>
            <td>
                ${item.is_anggota_foz 
                    ? `<button class="btn btn-sm" onclick="toggleKeanggotaan('${item.id}', false)" style="color: var(--danger); border-color: #fca5a5;"><i class="fas fa-times"></i> Cabut Keanggotaan</button>`
                    : `<button class="btn btn-sm btn-primary" onclick="toggleKeanggotaan('${item.id}', true)"><i class="fas fa-check"></i> Verifikasi Anggota</button>`
                }
            </td>
        </tr>
    `).join('');
}

window.toggleKeanggotaan = async function(id, isAnggota) {
    if (!confirm(`Apakah Anda yakin ingin mengubah status lembaga ini menjadi ${isAnggota ? 'Anggota FOZ' : 'Bukan Anggota'}?`)) return;
    
    try {
        const { error } = await supabaseClient
            .from('lembaga_zakat')
            .update({ is_anggota_foz: isAnggota })
            .eq('id', id);
            
        if (error) throw error;
        
        // Refresh data
        await loadLembagaData();
    } catch (e) {
        alert("Gagal memperbarui status keanggotaan.");
        console.error(e);
    }
};
