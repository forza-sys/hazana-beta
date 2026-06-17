document.addEventListener('DOMContentLoaded', async () => {
    if (!window.HAZANA_USER) {
        window.addEventListener('hazana:user-ready', initLembaga);
    } else {
        initLembaga();
    }
});

async function initLembaga() {
    const user = window.HAZANA_USER;
    if (user.role !== 'SUPER_ADMIN') {
        window.location.href = '../index.html';
        return;
    }
    
    document.getElementById('user-name').textContent = user.nama_lengkap || user.email;
    document.getElementById('user-role').textContent = user.role.replace('_', ' ');

    await loadLembagaData();
}

async function loadLembagaData() {
    try {
        const { data, error, count } = await supabaseClient
            .from('master_lembaga')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error("Error fetching lembaga:", error);
            if(error.code === '42P01') {
                document.getElementById('lembaga-table-body').innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem;">Tabel master_lembaga belum dibuat di Supabase. Silakan eksekusi SQL script.</td></tr>`;
                return;
            }
            throw error;
        }
        
        let total = data.length;
        let anggota = data.filter(d => d.is_foz_member).length;
        let nonAnggota = total - anggota;
        
        document.getElementById('stat-total-lembaga').textContent = total;
        document.getElementById('stat-anggota-foz').textContent = anggota;
        document.getElementById('stat-non-anggota').textContent = nonAnggota;
        
        renderLembagaTable(data);
    } catch (e) {
        console.error("Gagal load lembaga:", e);
        document.getElementById('lembaga-table-body').innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem; color: red;">Gagal memuat data lembaga.</td></tr>`;
    }
}

function renderLembagaTable(data) {
    const tbody = document.getElementById('lembaga-table-body');
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem;">Belum ada data lembaga terdaftar.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = data.map(item => `
        <tr>
            <td>
                <div style="font-weight: 700; color: var(--text-main);">${item.nama_lembaga}</div>
            </td>
            <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${item.tipe_lembaga || '-'}</span></td>
            <td>
                ${item.is_foz_member 
                    ? '<span class="badge badge-success"><i class="fas fa-check-circle" style="margin-right: 4px;"></i> Anggota FOZ</span>' 
                    : '<span class="badge badge-warning"><i class="fas fa-clock" style="margin-right: 4px;"></i> Belum Anggota</span>'}
            </td>
            <td>
                <button class="btn btn-sm" onclick="editLembaga('${item.lembaga_id}')" style="margin-right: 0.5rem;"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-sm" onclick="deleteLembaga('${item.lembaga_id}')" style="color: var(--danger); border-color: #fca5a5;"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// Modal Functions
function openLembagaModal() {
    document.getElementById('lembaga-form').reset();
    document.getElementById('lembaga-id').value = '';
    document.getElementById('modal-title').textContent = 'Tambah Lembaga Baru';
    document.getElementById('lembaga-modal').classList.add('active');
}

function closeLembagaModal() {
    document.getElementById('lembaga-modal').classList.remove('active');
}

async function editLembaga(id) {
    try {
        const { data, error } = await supabaseClient
            .from('master_lembaga')
            .select('*')
            .eq('lembaga_id', id)
            .single();
            
        if (error) throw error;
        
        document.getElementById('lembaga-id').value = data.lembaga_id;
        document.getElementById('nama_lembaga').value = data.nama_lembaga;
        document.getElementById('tipe_lembaga').value = data.tipe_lembaga || 'LAZNAS';
        
        document.getElementById('modal-title').textContent = 'Edit Data Lembaga';
        document.getElementById('lembaga-modal').classList.add('active');
    } catch (e) {
        alert("Gagal mengambil data lembaga.");
        console.error(e);
    }
}

async function saveLembaga(e) {
    e.preventDefault();
    const btnSave = document.getElementById('btn-save');
    btnSave.textContent = 'Menyimpan...';
    btnSave.disabled = true;
    
    const id = document.getElementById('lembaga-id').value;
    const payload = {
        nama_lembaga: document.getElementById('nama_lembaga').value,
        tipe_lembaga: document.getElementById('tipe_lembaga').value,
        is_foz_member: false
    };
    
    try {
        if (id) {
            delete payload.is_foz_member; // Jangan timpa status anggota saat edit nama/tipe
            const { error } = await supabaseClient.from('master_lembaga').update(payload).eq('lembaga_id', id);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient.from('master_lembaga').insert([payload]);
            if (error) throw error;
        }
        
        closeLembagaModal();
        await loadLembagaData();
    } catch (err) {
        alert("Gagal menyimpan data: " + err.message);
        console.error(err);
    } finally {
        btnSave.textContent = 'Simpan Data';
        btnSave.disabled = false;
    }
}

async function deleteLembaga(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus lembaga ini?")) return;
    
    try {
        const { error } = await supabaseClient.from('lembaga_zakat').delete().eq('id', id);
        if (error) throw error;
        await loadLembagaData();
    } catch (e) {
        alert("Gagal menghapus data lembaga.");
        console.error(e);
    }
}
