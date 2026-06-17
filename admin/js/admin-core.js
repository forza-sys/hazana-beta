/**
 * Core JS untuk Admin Dashboard (IT) HAZANA BETA
 * Fokus: Manajemen Akun Pengguna
 */

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.HAZANA_USER) {
        window.addEventListener('hazana:user-ready', initAdmin);
    } else {
        initAdmin();
    }
});

async function initAdmin() {
    const user = window.HAZANA_USER;
    
    document.getElementById('user-name').textContent = user.nama_lengkap || user.email;
    document.getElementById('user-role').textContent = user.role.replace('_', ' ');

    await loadUserStats();
    await loadRecentUsers();
}

async function loadUserStats() {
    try {
        const { count: countTotal, error: err1 } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        if (!err1) document.getElementById('stat-total-users').textContent = countTotal;

        // Simulasi: yang masih GUEST atau belum diverifikasi
        const { count: countPending, error: err2 } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'GUEST');
        if (!err2) document.getElementById('stat-pending').textContent = countPending;

        // Count Executive
        const { count: countExec, error: err3 } = await supabaseClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'EXECUTIVE_FOZ');
        if (!err3) document.getElementById('stat-exec').textContent = countExec;

    } catch (e) {
        console.error("Gagal load stats:", e);
    }
}

async function loadRecentUsers() {
    const tbody = document.getElementById('users-table-body');
    const { data, error } = await supabaseClient
        .from('profiles')
        .select(`
            id, role, nama_lengkap, is_active,
            master_lembaga(nama_lembaga)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error || !data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #64748b;">Belum ada data pengguna terdaftar.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(p => {
        let roleBadge = '';
        if (p.role === 'ADMIN_FOZ') roleBadge = '<span class="badge badge-danger">Admin IT</span>';
        else if (p.role === 'EXECUTIVE_FOZ') roleBadge = '<span class="badge badge-success">Eksekutor ZIS</span>';
        else if (p.role === 'ANGGOTA_FOZ') roleBadge = '<span class="badge badge-warning">Anggota FOZ</span>';
        else roleBadge = '<span class="badge" style="background:#e2e8f0;">GUEST</span>';

        tbody.innerHTML += `
            <tr>
                <td><strong>${p.nama_lengkap || 'Pengguna Tanpa Nama'}</strong><br><span style="font-size:0.75rem; color:var(--text-muted)">ID: ${p.id.split('-')[0]}...</span></td>
                <td>${p.master_lembaga ? p.master_lembaga.nama_lembaga : '<i style="color:var(--danger)">Belum dipetakan</i>'}</td>
                <td>${roleBadge}</td>
                <td>
                    <select class="btn btn-outline btn-sm" onchange="changeRole('${p.id}', this.value)">
                        <option value="">Ubah Role...</option>
                        <option value="ADMIN_FOZ">Jadikan Admin IT</option>
                        <option value="EXECUTIVE_FOZ">Jadikan Eksekutor</option>
                        <option value="ANGGOTA_FOZ">Jadikan Anggota</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

window.changeRole = async function(userId, newRole) {
    if (!newRole) return;
    if (!confirm(`Yakin mengubah role pengguna ini menjadi ${newRole}?`)) return;

    const { error } = await supabaseClient
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        alert("Gagal mengubah role: " + error.message);
    } else {
        alert("Role berhasil diubah!");
        loadUserStats();
        loadRecentUsers();
    }
}
