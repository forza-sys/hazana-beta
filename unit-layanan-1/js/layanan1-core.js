// Layanan 1 Core Logic (Iuran Anggota)

// Mock Data
const MOCK_IURAN_DATA = [
    { id: 1, nama_lembaga: 'Dompet Dhuafa', target_iuran: 50000000, status: 'lunas', tanggal_bayar: '10 Jan 2026' },
    { id: 2, nama_lembaga: 'Rumah Zakat', target_iuran: 50000000, status: 'lunas', tanggal_bayar: '15 Jan 2026' },
    { id: 3, nama_lembaga: 'BAZNAS RI', target_iuran: 75000000, status: 'lunas', tanggal_bayar: '20 Jan 2026' },
    { id: 4, nama_lembaga: 'Nurul Hayat', target_iuran: 25000000, status: 'menunggak', tanggal_bayar: '-' },
    { id: 5, nama_lembaga: 'Yatim Mandiri', target_iuran: 30000000, status: 'lunas', tanggal_bayar: '05 Feb 2026' },
    { id: 6, nama_lembaga: 'LAZ Al Azhar', target_iuran: 20000000, status: 'menunggak', tanggal_bayar: '-' },
    { id: 7, nama_lembaga: 'Inisiatif Zakat Indonesia', target_iuran: 35000000, status: 'lunas', tanggal_bayar: '12 Feb 2026' },
    { id: 8, nama_lembaga: 'Dompet Sosial Madani', target_iuran: 10000000, status: 'menunggak', tanggal_bayar: '-' },
];

function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

function bootLayanan1Page() {
    function init() {
        const user = window.HAZANA_USER || { nama_lengkap: 'Admin Layanan 1 (Test)', email: 'test@example.com' };
        
        // Update user profile info in navbar
        const nameEl = document.getElementById('user-name');
        const roleEl = document.getElementById('user-role');
        if (nameEl) nameEl.textContent = user.nama_lengkap || user.email;
        if (roleEl) roleEl.textContent = 'Unit Layanan 1';

        initDashboard();
        initIuranTable();
    }

    if (!window.HAZANA_USER) {
        window.addEventListener('hazana:user-ready', init);
        
        // Fallback for UI testing without login
        setTimeout(() => {
            if (!window.HAZANA_USER && document.getElementById('user-name') && (!document.getElementById('user-name').textContent || document.getElementById('user-name').textContent === 'Loading...')) {
                init();
            }
        }, 1000);
    } else {
        init();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootLayanan1Page);
} else {
    bootLayanan1Page();
}
window.addEventListener('hazana:pjax-loaded', bootLayanan1Page);

function initDashboard() {
    const tbody = document.getElementById('recent-payments-body');
    if (!tbody) return; // Not on dashboard page

    // Filter lunas only and sort by date (mock sort)
    const lunasData = MOCK_IURAN_DATA.filter(d => d.status === 'lunas').slice(0, 5);
    
    let html = '';
    lunasData.forEach(d => {
        html += `
            <tr>
                <td>${d.tanggal_bayar}</td>
                <td><strong>${d.nama_lembaga}</strong></td>
                <td>${formatRupiah(d.target_iuran)}</td>
                <td><span class="badge" style="background: var(--success); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">Berhasil</span></td>
            </tr>
        `;
    });

    if (lunasData.length === 0) {
        html = '<tr><td colspan="4" style="text-align: center;">Belum ada pembayaran terbaru.</td></tr>';
    }
    
    tbody.innerHTML = html;
}

function initIuranTable() {
    const tbody = document.getElementById('iuran-table-body');
    if (!tbody) return; // Not on iuran page

    const searchInput = document.getElementById('search-lembaga');
    const filterSelect = document.getElementById('filter-status');

    function renderTable() {
        const query = searchInput.value.toLowerCase();
        const statusFilter = filterSelect.value;

        const filtered = MOCK_IURAN_DATA.filter(d => {
            const matchQuery = d.nama_lembaga.toLowerCase().includes(query);
            const matchStatus = statusFilter === 'all' || d.status === statusFilter;
            return matchQuery && matchStatus;
        });

        let html = '';
        filtered.forEach(d => {
            let badgeClass = d.status === 'lunas' ? 'badge-lunas' : 'badge-menunggak';
            let badgeText = d.status === 'lunas' ? 'LUNAS' : 'MENUNGGAK';
            
            let actions = '';
            if (d.status === 'menunggak') {
                actions = `
                    <div class="action-btns">
                        <button class="btn-invoice" onclick="openInvoiceModal('${d.nama_lembaga}', ${d.target_iuran})"><i class="fas fa-file-invoice"></i> Buat Invoice</button>
                        <button class="btn-reminder" onclick="openReminderModal('${d.nama_lembaga}', ${d.target_iuran})"><i class="fab fa-whatsapp"></i> Reminder</button>
                    </div>
                `;
            } else {
                actions = `<span style="color: var(--text-muted); font-size: 0.875rem;"><i class="fas fa-check-circle"></i> Selesai</span>`;
            }

            html += `
                <tr>
                    <td><strong>${d.nama_lembaga}</strong></td>
                    <td>${formatRupiah(d.target_iuran)}</td>
                    <td><span class="${badgeClass}">${badgeText}</span></td>
                    <td>${actions}</td>
                </tr>
            `;
        });

        if (filtered.length === 0) {
            html = '<tr><td colspan="4" style="text-align: center;">Tidak ada data ditemukan.</td></tr>';
        }

        tbody.innerHTML = html;
    }

    searchInput.addEventListener('input', renderTable);
    filterSelect.addEventListener('change', renderTable);

    renderTable();
}

// Modal Functions
window.openInvoiceModal = function(lembaga, nominal) {
    document.getElementById('inv-lembaga').textContent = lembaga;
    document.getElementById('inv-nominal').textContent = formatRupiah(nominal);
    document.getElementById('modal-invoice').classList.add('active');
};

window.openReminderModal = function(lembaga, nominal) {
    document.getElementById('rem-lembaga').textContent = lembaga;
    const textAreas = document.querySelectorAll('#modal-reminder textarea');
    if(textAreas.length > 0) {
        textAreas[0].value = \`Halo Bapak/Ibu perwakilan \${lembaga}, kami dari Sekretariat FOZ mengingatkan bahwa Iuran Anggota tahun 2026 sebesar \${formatRupiah(nominal)} belum dibayarkan. Mohon segera melakukan pembayaran. Terima kasih.\`;
    }
    document.getElementById('modal-reminder').classList.add('active');
};

window.processInvoice = function() {
    alert("Invoice berhasil dibuat dan dikirim ke email lembaga!");
    document.getElementById('modal-invoice').classList.remove('active');
};

window.processReminder = function() {
    alert("Membuka WhatsApp Web untuk mengirim pesan reminder...");
    document.getElementById('modal-reminder').classList.remove('active');
};
