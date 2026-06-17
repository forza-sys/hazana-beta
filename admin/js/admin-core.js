/**
 * Core JS untuk Admin Dashboard (IT) HAZANA BETA
 * Fokus: Manajemen Akun Pengguna (Sekretariat & Lembaga)
 */

function bootAdminPage() {
    if (!window.HAZANA_USER) {
        window.addEventListener('hazana:user-ready', initAdmin);
    } else {
        initAdmin();
    }

    // Tab Logic
    const tabSekretariat = document.getElementById('tab-sekretariat');
    const tabLembaga = document.getElementById('tab-lembaga');
    const contentSekretariat = document.getElementById('content-sekretariat');
    const contentLembaga = document.getElementById('content-lembaga');

    if (tabSekretariat && tabLembaga) {
        tabSekretariat.addEventListener('click', () => {
            tabSekretariat.classList.add('active');
            tabSekretariat.style.color = 'var(--primary)';
            tabSekretariat.style.borderBottom = '3px solid var(--primary)';
            
            tabLembaga.classList.remove('active');
            tabLembaga.style.color = '#64748b';
            tabLembaga.style.borderBottom = 'none';

            contentSekretariat.style.display = 'block';
            contentLembaga.style.display = 'none';
        });

        tabLembaga.addEventListener('click', () => {
            tabLembaga.classList.add('active');
            tabLembaga.style.color = 'var(--primary)';
            tabLembaga.style.borderBottom = '3px solid var(--primary)';
            
            tabSekretariat.classList.remove('active');
            tabSekretariat.style.color = '#64748b';
            tabSekretariat.style.borderBottom = 'none';

            contentLembaga.style.display = 'block';
            contentSekretariat.style.display = 'none';
        });
    }

    // Fallback UI test data if not logged in
    setTimeout(() => {
        if (document.getElementById('user-name') && (!document.getElementById('user-name').textContent || document.getElementById('user-name').textContent === 'Memuat...')) {
            document.getElementById('user-name').textContent = 'Admin (Test)';
            document.getElementById('user-role').textContent = 'SUPER_ADMIN';
            renderMockSekretariat();
            renderMockLembaga();
        }
    }, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAdminPage);
} else {
    bootAdminPage();
}
window.addEventListener('hazana:pjax-loaded', bootAdminPage);

async function initAdmin() {
    const user = window.HAZANA_USER;
    
    document.getElementById('user-name').textContent = user.nama_lengkap || user.email;
    document.getElementById('user-role').textContent = user.role.replace('_', ' ');

    // For now, render mock data since DB structure for new roles might not exist yet
    renderMockSekretariat();
    renderMockLembaga();
}

function renderMockSekretariat() {
    const tbody = document.getElementById('sekretariat-table-body');
    if (!tbody) return;

    const mockData = [
        { nama: 'Ahmad Fauzi', email: 'ahmad@forumzakat.org', role: 'Direktur Eksekutif' },
        { nama: 'Budi Santoso', email: 'budi@forumzakat.org', role: 'Pengurus Harian' },
        { nama: 'Citra Kirana', email: 'citra@forumzakat.org', role: 'Pengurus' },
        { nama: 'Dewi Lestari', email: 'dewi@forumzakat.org', role: 'Bidang' },
        { nama: 'Eko Prasetyo', email: 'eko@forumzakat.org', role: 'Unit Layanan 1' },
        { nama: 'Fajar Hidayat', email: 'fajar@forumzakat.org', role: 'Unit Layanan 2' }
    ];

    let html = '';
    mockData.forEach(p => {
        html += `
            <tr>
                <td><strong>${p.nama}</strong></td>
                <td>${p.email}</td>
                <td><span class="badge" style="background:var(--primary); color:white; padding:4px 8px; border-radius:4px; font-size:0.75rem;">${p.role}</span></td>
                <td>
                    <select class="btn btn-outline btn-sm">
                        <option>Ubah Role</option>
                        <option>Pengurus</option>
                        <option>Pengurus Harian</option>
                        <option>Unit Layanan 1</option>
                        <option>Unit Layanan 2</option>
                        <option>Bidang</option>
                        <option>Direktur Eksekutif</option>
                    </select>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

function renderMockLembaga() {
    const tbody = document.getElementById('lembaga-table-body');
    if (!tbody) return;

    const mockData = [
        { nama: 'Dompet Dhuafa', email: 'admin@dompetdhuafa.org', status: 'Terverifikasi' },
        { nama: 'Rumah Zakat', email: 'info@rumahzakat.org', status: 'Terverifikasi' },
        { nama: 'BAZNAS RI', email: 'kontak@baznas.go.id', status: 'Terverifikasi' },
        { nama: 'LAZ Al Azhar', email: 'laz@al-azhar.org', status: 'Menunggu' },
        { nama: 'Nurul Hayat', email: 'admin@nurulhayat.org', status: 'Terverifikasi' }
    ];

    let html = '';
    mockData.forEach(p => {
        let badgeStyle = p.status === 'Terverifikasi' ? 'background:var(--success); color:white;' : 'background:var(--warning); color:white;';
        html += `
            <tr>
                <td><strong>${p.nama}</strong></td>
                <td>${p.email}</td>
                <td><span class="badge" style="${badgeStyle} padding:4px 8px; border-radius:4px; font-size:0.75rem;">${p.status}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm"><i class="fas fa-edit"></i> Edit</button>
                    <button class="btn btn-outline btn-sm" style="color:var(--danger); border-color:var(--danger);"><i class="fas fa-ban"></i> Blokir</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}
