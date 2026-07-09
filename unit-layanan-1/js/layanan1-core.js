// Layanan 1 Core Logic (Iuran Anggota)

// Data Iuran
let MOCK_IURAN_DATA = [];
let MOCK_IURAN_DATA_YEARS = {};
let CURRENT_YEAR = '2026';
let CURRENT_MONTH = 'all';

function parseBergabung(str) {
    if (!str || str === '-') return null;
    const parts = str.split(' ');
    if (parts.length < 2) return null;
    const mStr = parts[0].toLowerCase();
    const yStr = parseInt(parts[1], 10);
    const months = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
    const mIdx = months.findIndex(m => m.startsWith(mStr.substring(0,3)));
    if (mIdx === -1 || isNaN(yStr)) return null;
    return { month: mIdx, year: yStr };
}

function calculateFromPenghimpunan(p) {
    if (p < 250000000) return { level: '1', iuran: 100000 };
    if (p < 500000000) return { level: '2', iuran: 150000 };
    if (p < 750000000) return { level: '3', iuran: 200000 };
    if (p < 1000000000) return { level: '4', iuran: 250000 };
    if (p < 3000000000) return { level: '5', iuran: 500000 };
    if (p < 5000000000) return { level: '6', iuran: 1000000 };
    if (p < 10000000000) return { level: '7', iuran: 2000000 };
    if (p < 20000000000) return { level: '8', iuran: 3000000 };
    return { level: '9', iuran: 4000000 };
}

function formatSingkat(num) {
    if (!num) return 'Rp 0';
    if (num >= 1000000000000) return 'Rp ' + (num / 1000000000000).toFixed(1).replace('.', ',') + ' T';
    if (num >= 1000000000) return 'Rp ' + (num / 1000000000).toFixed(1).replace('.', ',') + ' M';
    if (num >= 1000000) return 'Rp ' + (num / 1000000).toFixed(1).replace('.', ',') + ' Jt';
    return formatRupiah(num);
}

let pendapatanChartInstance = null;
let persentaseChartInstance = null;

function isPaidForMonth(d, month) {
    if (month === 'all') return d.status === 'lunas';
    if (d.termin_pembayaran === 'Bulan') {
        return !!d.rincian_bayar[month];
    } else if (d.termin_pembayaran === 'Semester') {
        const isSem1 = ['Januari','Februari','Maret','April','Mei','Juni'].includes(month);
        return !!d.rincian_bayar[isSem1 ? 'Semester 1' : 'Semester 2'];
    } else {
        return !!d.rincian_bayar['Tahunan'];
    }
}

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

async function initIuranTable() {
    const tbody = document.getElementById('iuran-table-body');
    if (!tbody) return; // Not on iuran page

    const searchInput = document.getElementById('search-lembaga');
    const filterSelect = document.getElementById('filter-status');
    const searchKomitmen = document.getElementById('search-komitmen');

    try {
        const data = window.MOCK_JSON_DATA;
        if (data) {
            if (!data || !Array.isArray(data)) {
                console.warn("MOCK_IURAN_DATA kosong atau format salah:", data);
                return;
            } else {
                // Setup years data
                ['2022', '2023', '2024', '2025', '2026'].forEach(year => {
                    MOCK_IURAN_DATA_YEARS[year] = data.map((d, idx) => ({
                        id: d.id_lembaga || idx,
                        nama_lembaga: d.nama_lembaga,
                        skala_lembaga: d.skala_lembaga,
                        bergabung: d.bergabung || '-',
                        penghimpunan: d.total_penghimpunan,
                        seharusnya: d.iuran_seharusnya,
                        target_iuran: d.komitmen_iuran,
                        sumber: d.sumber,
                        termin_pembayaran: 'Bulan',
                        rincian_bayar: d.history ? (d.history[year] || {}) : {},
                        status: 'menunggak',
                        tanggal_bayar: '-'
                    }));
                    MOCK_IURAN_DATA_YEARS[year].forEach(item => updateStatusLembaga(item));
                });

                MOCK_IURAN_DATA = MOCK_IURAN_DATA_YEARS[CURRENT_YEAR];
            }

            // Expose local functions to window so HTML onchange handlers can call them
            window.renderTable = renderTable;
            window.renderKomitmenTable = renderKomitmenTable;
            window.renderDashboard = renderDashboard;
            
            window.changeYear = function(year) {
                CURRENT_YEAR = year;
                MOCK_IURAN_DATA = MOCK_IURAN_DATA_YEARS[year];
                
                // Sync UI select elements
                document.querySelectorAll('.filter-tahun').forEach(s => s.value = year);
                
                // Update display spans
                document.querySelectorAll('.display-tahun').forEach(span => {
                    span.textContent = year;
                });
                
                renderTable();
                renderKomitmenTable();
                renderDashboard();
            };

            // Render table & komitmen immediately
            renderTable();
            renderKomitmenTable();

            // Delay dashboard render so browser has time to restore
            // form/select values from session history (bfcache / autocomplete)
            // Without this, querySelector reads 'all' before browser restores 'Januari'
            setTimeout(function() {
                renderDashboard();
            }, 50);
            
            // Year filter sync
            const yearFilters = document.querySelectorAll('.filter-tahun');
            yearFilters.forEach(select => {
                select.addEventListener('change', (e) => {
                    const year = e.target.value;
                    CURRENT_YEAR = year;
                    
                    // Sync UI select elements
                    yearFilters.forEach(s => s.value = year);
                    
                    // Update display spans
                    document.querySelectorAll('.display-tahun').forEach(span => {
                        span.textContent = year;
                    });
                    
                    // Switch data
                    MOCK_IURAN_DATA = MOCK_IURAN_DATA_YEARS[year];
                    
                    // Re-render all tables and dashboard
                    renderTable();
                    renderKomitmenTable();
                    renderDashboard(); // <-- was missing!
                });
            });
            
            // Month filter sync
            const monthFilters = document.querySelectorAll('.filter-bulan');
            monthFilters.forEach(select => {
                select.addEventListener('change', (e) => {
                    const month = e.target.value;
                    CURRENT_MONTH = month;
                    
                    // Sync UI select elements
                    monthFilters.forEach(s => s.value = month);
                    
                    // Re-render
                    renderTable();
                    renderDashboard();
                });
            });
        }
    } catch(e) {
        console.error("Gagal memuat komitmen iuran:", e);
    }


    window.togglePayment = function(id, periode, checkboxElement) {
        const d = MOCK_IURAN_DATA.find(x => x.id == id);
        if (d) {
            d.rincian_bayar[periode] = checkboxElement.checked;
            // Update the local status dynamically if needed
            if (d.termin_pembayaran === 'Tahunan') {
                d.status = checkboxElement.checked ? 'lunas' : 'menunggak';
            }
            if (typeof renderDashboard === 'function') renderDashboard();
            // Re-eval badge style visually
            const tr = checkboxElement.closest('tr');
            if (tr) {
                const badge = tr.querySelector('.badge');
                if (badge) {
                    badge.className = checkboxElement.checked ? 'badge badge-success' : 'badge badge-danger';
                    badge.textContent = checkboxElement.checked ? 'LUNAS' : 'MENUNGGAK';
                }
            }
        }
    };

    function renderTable() {
        const tbody = document.getElementById('iuran-table-body');
        if (!tbody) return;

        const monthFilter = document.querySelector('.filter-bulan') ? document.querySelector('.filter-bulan').value : CURRENT_MONTH;
        const searchVal = document.getElementById('search-lembaga').value.toLowerCase();
        const statusFilter = document.getElementById('filter-status').value;
        
        const currentYearNum = parseInt(CURRENT_YEAR);
        const monthsArr = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

        let filtered = MOCK_IURAN_DATA.filter(d => {
            if (searchVal && !d.nama_lembaga.toLowerCase().includes(searchVal)) return false;
            
            const bergabung = parseBergabung(d.bergabung);
            if (bergabung) {
                if (currentYearNum < bergabung.year) return false;
                if (monthFilter !== 'all') {
                    const mIdx = monthsArr.indexOf(monthFilter);
                    if (currentYearNum === bergabung.year && mIdx < bergabung.month) return false;
                }
            }

            const statusLunasLocal = isPaidForMonth(d, monthFilter);
            const statusString = statusLunasLocal ? 'lunas' : 'menunggak';
            
            if (statusFilter !== 'all' && statusFilter !== statusString) return false;
            
            return true;
        });

        let html = '';
        let rowCount = 0;

        filtered.forEach(d => {
            let periods = [];
            if (d.termin_pembayaran === 'Bulan') {
                periods = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            } else if (d.termin_pembayaran === 'Semester') {
                periods = ['Semester 1', 'Semester 2'];
            } else {
                periods = ['Tahunan'];
            }

            periods.forEach(p => {
                if (d.termin_pembayaran === 'Bulan' && monthFilter !== 'all' && p !== monthFilter) return;

                const isPaid = !!d.rincian_bayar[p];
                const currentStatus = isPaid ? 'lunas' : 'menunggak';
                
                if (statusFilter !== 'all' && currentStatus !== statusFilter) return;

                let badgeClass = isPaid ? 'badge-success' : 'badge-danger';
                let badgeText = isPaid ? 'LUNAS' : 'MENUNGGAK';
                let checkedAttr = isPaid ? 'checked' : '';

                let nominal = d.target_iuran;

                html += `
                    <tr>
                        <td><strong>${d.nama_lembaga}</strong></td>
                        <td>${CURRENT_YEAR}</td>
                        <td><span class="badge badge-info" style="background-color: var(--bg-hover); color: var(--text-main);">${p}</span></td>
                        <td>${formatRupiah(Math.round(nominal))}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input type="checkbox" onchange="togglePayment('${d.id}', '${p}', this)" ${checkedAttr} style="width: 1.2rem; height: 1.2rem; cursor: pointer;">
                                <span class="${badgeClass}" style="width: 90px; text-align: center;">${badgeText}</span>
                            </div>
                        </td>
                    </tr>
                `;
                rowCount++;
            });
        });

        if (rowCount === 0) {
            html = '<tr><td colspan="5" style="text-align: center;">Tidak ada data ditemukan.</td></tr>';
        }

        tbody.innerHTML = html;
        if (typeof renderDashboard === 'function') renderDashboard();
    }

    if (searchInput) searchInput.addEventListener('input', renderTable);
    if (filterSelect) filterSelect.addEventListener('change', renderTable);

    function formatBergabungDate(dateStr) {
        if (!dateStr || dateStr === '-') return '-';
        const monthMap = {
            'Januari': 'Jan', 'Februari': 'Feb', 'Maret': 'Mar', 'April': 'Apr',
            'Mei': 'Mei', 'Juni': 'Jun', 'Juli': 'Jul', 'Agustus': 'Agt',
            'September': 'Sep', 'Oktober': 'Okt', 'November': 'Nov', 'Desember': 'Des'
        };
        let formatted = dateStr;
        Object.keys(monthMap).forEach(key => {
            if (formatted.includes(key)) {
                formatted = formatted.replace(key, monthMap[key]);
            }
        });
        return formatted;
    }

    let currentSortCol = '';
    let currentSortAsc = true;

    function renderDashboardKomitmen(data) {
        if (!document.getElementById('dash-total-lembaga')) return;
        
        let totalLembaga = data.length;
        let cNasional = 0, cProvinsi = 0, cKabKota = 0;
        let countGreen = 0, countYellow = 0, countRed = 0;
        let totalKomitmen = 0, totalPotensi = 0;

        data.forEach(d => {
            // Count Skala
            const s = d.skala_lembaga || 'Nasional';
            if (s === 'Nasional') cNasional++;
            else if (s === 'Provinsi') cProvinsi++;
            else cKabKota++;

            // Calculate Value
            const calc = calculateFromPenghimpunan(d.penghimpunan || 0);
            const seharusnya = calc.iuran;
            totalPotensi += seharusnya;
            totalKomitmen += (d.target_iuran || 0);

            // Calculate Status
            if (seharusnya > 0) {
                const percent = (d.target_iuran / seharusnya) * 100;
                if (percent >= 100) countGreen++;
                else if (percent >= 50) countYellow++;
                else countRed++;
            } else {
                countRed++; // Default to red if no potensi or 0
            }
        });

        // Update Lembaga Counts
        document.getElementById('dash-total-lembaga').innerText = totalLembaga;
        document.getElementById('dash-count-nasional').innerText = cNasional;
        document.getElementById('dash-count-provinsi').innerText = cProvinsi;
        document.getElementById('dash-count-kabkota').innerText = cKabKota;

        // Update Values
        document.getElementById('dash-total-komitmen').innerText = formatRupiah(totalKomitmen);
        document.getElementById('dash-total-potensi').innerText = formatRupiah(totalPotensi);
        const valPct = totalPotensi > 0 ? (totalKomitmen / totalPotensi) * 100 : 0;
        document.getElementById('dash-bar-potensi').style.width = Math.min(valPct, 100) + '%';
        if (document.getElementById('dash-potensi-pct')) {
            document.getElementById('dash-potensi-pct').innerText = Math.round(valPct) + '%';
        }

        // Update Percentages
        const pGreen = totalLembaga > 0 ? Math.round((countGreen / totalLembaga) * 100) : 0;
        const pYellow = totalLembaga > 0 ? Math.round((countYellow / totalLembaga) * 100) : 0;
        const pRed = totalLembaga > 0 ? Math.round((countRed / totalLembaga) * 100) : 0;

        document.getElementById('dash-green-pct').innerText = pGreen + '%';
        document.getElementById('dash-yellow-pct').innerText = pYellow + '%';
        document.getElementById('dash-red-pct').innerText = pRed + '%';
        
        document.getElementById('dash-green-count').innerText = `(${countGreen})`;
        document.getElementById('dash-yellow-count').innerText = `(${countYellow})`;
        document.getElementById('dash-red-count').innerText = `(${countRed})`;

        document.getElementById('dash-bar-green').style.width = pGreen + '%';
        document.getElementById('dash-bar-yellow').style.width = pYellow + '%';
        document.getElementById('dash-bar-red').style.width = pRed + '%';
    }

    function renderKomitmenTable() {
        const tbodyKomitmen = document.getElementById('komitmen-table-body');
        const searchKomitmen = document.getElementById('search-komitmen');
        const filterStatus = document.getElementById('filter-komitmen-status');
        const filterSkala = document.getElementById('filter-skala');
        
        if (!tbodyKomitmen) return;
        
        let query = searchKomitmen ? searchKomitmen.value.toLowerCase() : '';
        let statusVal = filterStatus ? filterStatus.value : 'all';
        let skalaVal = filterSkala ? filterSkala.value : 'all';
        const currentYearNum = parseInt(CURRENT_YEAR);
        
        let filtered = MOCK_IURAN_DATA.filter(d => {
            if (query && !d.nama_lembaga.toLowerCase().includes(query)) return false;
            
            const calc = calculateFromPenghimpunan(d.penghimpunan || 0);
            const percent = calc.iuran > 0 ? (d.target_iuran / calc.iuran) * 100 : 100;
            
            if (statusVal === 'green' && percent < 100) return false;
            if (statusVal === 'yellow' && (percent < 50 || percent >= 100)) return false;
            if (statusVal === 'red' && percent >= 50) return false;
            
            if (skalaVal !== 'all') {
                const s = d.skala_lembaga || 'Nasional';
                if (skalaVal === 'Kab/Kota') {
                    if (s !== 'Kabupaten/Kota' && s !== 'Kab/Kota') return false;
                } else {
                    if (s !== skalaVal) return false;
                }
            }
            
            const bergabung = parseBergabung(d.bergabung);
            if (bergabung && currentYearNum < bergabung.year) return false;
            return true;
        });

        if (currentSortCol) {
            filtered.sort((a, b) => {
                let valA = a[currentSortCol];
                let valB = b[currentSortCol];
                
                if (currentSortCol === 'skala') {
                    valA = parseInt(calculateFromPenghimpunan(a.penghimpunan || 0).level);
                    valB = parseInt(calculateFromPenghimpunan(b.penghimpunan || 0).level);
                } else if (currentSortCol === 'bergabung') {
                    const pA = parseBergabung(a.bergabung);
                    const pB = parseBergabung(b.bergabung);
                    valA = pA ? pA.year * 12 + pA.month : 0;
                    valB = pB ? pB.year * 12 + pB.month : 0;
                } else if (currentSortCol === 'nama_lembaga' || currentSortCol === 'termin_pembayaran' || currentSortCol === 'skala_lembaga') {
                    valA = (valA || '').toString().toLowerCase();
                    valB = (valB || '').toString().toLowerCase();
                } else {
                    valA = parseFloat(valA) || 0;
                    valB = parseFloat(valB) || 0;
                }
                
                if (valA < valB) return currentSortAsc ? -1 : 1;
                if (valA > valB) return currentSortAsc ? 1 : -1;
                return 0;
            });
        }
        
        renderDashboardKomitmen(filtered);

        let html = '';
        filtered.forEach((d, index) => {
            const calc = calculateFromPenghimpunan(d.penghimpunan || 0);
            d.seharusnya = calc.iuran;
            
            let sumberText = '';
            if (d.sumber_manual) {
                sumberText = d.sumber_manual;
            } else if (d.sumber) {
                sumberText = d.sumber;
            } else {
                sumberText = (d.penghimpunan && d.penghimpunan > 0) ? 'LPZN 2025' : 'Belum Ada Data';
            }
            
            let komitmenColor = '#10b981'; // Green
            if (d.seharusnya > 0) {
                const percent = (d.target_iuran / d.seharusnya) * 100;
                if (percent >= 100) komitmenColor = '#10b981'; // Green
                else if (percent >= 50) komitmenColor = '#f59e0b'; // Yellow
                else komitmenColor = '#ef4444'; // Red
            }
            
            let skalaBadgeColor = 'var(--text-muted)';
            if (d.skala_lembaga === 'Nasional') skalaBadgeColor = '#3b82f6';
            else if (d.skala_lembaga === 'Provinsi') skalaBadgeColor = '#8b5cf6';
            else if (d.skala_lembaga === 'Kabupaten/Kota' || d.skala_lembaga === 'Kab/Kota') skalaBadgeColor = '#14b8a6';
            
            html += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                            <span style="font-size: 0.75rem; color: var(--text-muted); width: 20px; text-align: right; margin-top: 2px;">${index + 1}.</span>
                            <strong>${d.nama_lembaga}</strong>
                        </div>
                    </td>
                    <td>
                        <span style="font-size: 0.65rem; color: white; background-color: ${skalaBadgeColor}; padding: 2px 6px; border-radius: 4px; width: fit-content;">${d.skala_lembaga || 'Nasional'}</span>
                    </td>
                    <td class="editable-cell" data-id="${d.id}" data-field="bergabung" style="color: var(--primary); cursor: pointer; font-size: 0.85rem;" title="Klik untuk edit">${formatBergabungDate(d.bergabung)}</td>
                    <td style="cursor: pointer;">
                        <div style="display: flex; flex-direction: column; align-items: flex-start;">
                            <span class="editable-cell" data-id="${d.id}" data-field="penghimpunan" style="color: var(--primary);" title="Klik untuk edit angka">${formatSingkat(d.penghimpunan || 0)}</span>
                            <span class="editable-cell" data-id="${d.id}" data-field="sumber" style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px; cursor: pointer;" title="Klik untuk edit sumber">(${sumberText})</span>
                        </div>
                    </td>
                    <td style="font-weight: bold; color: var(--text-main); font-size: 0.85rem;">
                        <span class="badge badge-warning" style="background: transparent; color: var(--text-main); padding: 0;">${calc.level}</span>
                    </td>
                    <td style="color: var(--text-muted);">${formatRupiah(d.seharusnya)}</td>
                    <td class="editable-cell" data-id="${d.id}" data-field="target_iuran" style="font-weight: 800; color: ${komitmenColor}; cursor: pointer;" title="Klik untuk edit">${formatRupiah(d.target_iuran)}</td>
                    <td class="editable-cell" data-id="${d.id}" data-field="termin" style="cursor: pointer;" title="Klik untuk edit"><span class="badge badge-info" style="background-color: var(--bg-hover); color: var(--primary);">${d.termin_pembayaran}</span></td>
                </tr>
            `;
        });

        if (filtered.length === 0) {
            html = '<tr><td colspan="7" style="text-align: center;">Tidak ada data ditemukan.</td></tr>';
        }
        tbodyKomitmen.innerHTML = html;
        if (typeof renderDashboard === 'function') renderDashboard();
    }

    if (searchKomitmen) searchKomitmen.addEventListener('input', renderKomitmenTable);
    
    const filterStatus = document.getElementById('filter-komitmen-status');
    if (filterStatus) filterStatus.addEventListener('change', renderKomitmenTable);
    
    const filterSkala = document.getElementById('filter-skala');
    if (filterSkala) filterSkala.addEventListener('change', renderKomitmenTable);

    // Setup Inline Editing
    document.addEventListener('click', (e) => {
        const cell = e.target.closest('.editable-cell');
        if (!cell || cell.querySelector('.inline-edit-input')) return;
        
        const id = cell.getAttribute('data-id');
        const field = cell.getAttribute('data-field');
        const d = MOCK_IURAN_DATA.find(x => x.id == id);
        if (!d) return;

        let inputHTML = '';
        if (field === 'bergabung') {
            inputHTML = `<input type="text" class="inline-edit-input" value="${d.bergabung === '-' ? '' : d.bergabung}" placeholder="Jan 2018" style="width: 100px; padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); outline: none;">`;
        } else if (field === 'penghimpunan') {
            inputHTML = `<input type="number" class="inline-edit-input" value="${d.penghimpunan || 0}" style="width: 120px; padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); outline: none;">`;
        } else if (field === 'sumber') {
            let defaultSumber = d.sumber || ((d.penghimpunan && d.penghimpunan > 0) ? 'LPZN 2025' : 'Belum Ada Data');
            inputHTML = `<input type="text" class="inline-edit-input" value="${d.sumber || defaultSumber}" style="width: 100px; padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); outline: none; font-size: 0.7rem;">`;
        } else if (field === 'target_iuran') {
            inputHTML = `<input type="number" class="inline-edit-input" value="${d.target_iuran}" style="width: 120px; padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); outline: none;">`;
        } else if (field === 'termin') {
            inputHTML = `
                <select class="inline-edit-input" style="padding: 4px; border-radius: 4px; border: 1px solid var(--border-color); outline: none;">
                    <option value="Bulan" ${d.termin_pembayaran === 'Bulan' ? 'selected' : ''}>Bulan</option>
                    <option value="Semester" ${d.termin_pembayaran === 'Semester' ? 'selected' : ''}>Semester</option>
                    <option value="Tahunan" ${d.termin_pembayaran === 'Tahunan' ? 'selected' : ''}>Tahunan</option>
                </select>
            `;
        }

        cell.innerHTML = inputHTML;
        const input = cell.querySelector('.inline-edit-input');
        input.focus();

        const save = () => {
            let val = input.value;
            if (field === 'bergabung') {
                d.bergabung = val || '-';
            } else if (field === 'penghimpunan') {
                d.penghimpunan = parseInt(val) || 0;
            } else if (field === 'sumber') {
                let defaultSumber = d.sumber || ((d.penghimpunan && d.penghimpunan > 0) ? 'LPZN 2025' : 'Belum Ada Data');
                d.sumber = val || defaultSumber;
            } else if (field === 'target_iuran') {
                d.target_iuran = parseInt(val) || 0;
            } else if (field === 'termin') {
                d.termin_pembayaran = val;
            }
            renderKomitmenTable();
            if (typeof renderDashboard === 'function') renderDashboard();
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });
    });

    // Setup Table Sorting
    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.getAttribute('data-sort');
            if (currentSortCol === sortKey) {
                currentSortAsc = !currentSortAsc;
            } else {
                currentSortCol = sortKey;
                currentSortAsc = true;
            }
            
            document.querySelectorAll('th.sortable i').forEach(icon => {
                icon.className = 'fas fa-sort';
                icon.style.color = 'var(--text-muted)';
            });
            const activeIcon = th.querySelector('i');
            if (activeIcon) {
                activeIcon.className = currentSortAsc ? 'fas fa-sort-up' : 'fas fa-sort-down';
                activeIcon.style.color = 'var(--primary)';
            }
            
            renderKomitmenTable();
        });
    });

    renderTable();
    renderKomitmenTable();
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
        textAreas[0].value = `Halo Bapak/Ibu perwakilan ${lembaga}, kami dari Sekretariat FOZ mengingatkan bahwa Iuran Anggota tahun 2026 sebesar ${formatRupiah(nominal)} belum dibayarkan. Mohon segera melakukan pembayaran. Terima kasih.`;
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

window.openEditKomitmenModal = function(id, lembaga, nominal, termin) {
    document.getElementById('edit-komitmen-id').value = id;
    document.getElementById('edit-komitmen-lembaga').value = lembaga;
    document.getElementById('edit-komitmen-nominal').value = nominal;
    document.getElementById('edit-komitmen-termin').value = termin;
    document.getElementById('modal-edit-komitmen').classList.add('active');
};

function updateStatusLembaga(d) {
    let requiredKeys = [];
    if (d.termin_pembayaran === 'Bulan') {
        requiredKeys = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    } else if (d.termin_pembayaran === 'Semester') {
        requiredKeys = ['Semester 1', 'Semester 2'];
    } else {
        requiredKeys = ['Tahunan'];
    }
    
    let allPaid = true;
    for (const key of requiredKeys) {
        if (!d.rincian_bayar[key]) {
            allPaid = false;
            break;
        }
    }
    d.status = allPaid ? 'lunas' : 'menunggak';
}

window.saveKomitmen = function(e) {
    e.preventDefault();
    const id = document.getElementById('edit-komitmen-id').value;
    const nominal = parseInt(document.getElementById('edit-komitmen-nominal').value);
    const termin = document.getElementById('edit-komitmen-termin').value;
    
    // Update local state
    const index = MOCK_IURAN_DATA.findIndex(d => String(d.id) === String(id));
    if (index !== -1) {
        MOCK_IURAN_DATA[index].target_iuran = nominal;
        MOCK_IURAN_DATA[index].termin_pembayaran = termin;
        MOCK_IURAN_DATA[index].rincian_bayar = {}; // reset rincian
        updateStatusLembaga(MOCK_IURAN_DATA[index]);
    }
    
    // Rerender both tables
    const searchInput = document.getElementById('search-lembaga');
    if (searchInput) searchInput.dispatchEvent(new Event('input'));
    
    const searchKomitmen = document.getElementById('search-komitmen');
    if (searchKomitmen) searchKomitmen.dispatchEvent(new Event('input'));

    document.getElementById('modal-edit-komitmen').classList.remove('active');
};



window.renderDashboard = function() {
    // Read month from dedicated dashboard select (most reliable)
    // Fallback: class-based selects, then global CURRENT_MONTH
    const dashSelect = document.getElementById('dash-filter-bulan');
    let activeDashMonth;
    if (dashSelect) {
        activeDashMonth = dashSelect.value || 'all';
    } else {
        const fallback = document.querySelector('.filter-bulan');
        activeDashMonth = fallback ? (fallback.value || 'all') : (CURRENT_MONTH || 'all');
    }
    CURRENT_MONTH = activeDashMonth;
    
    let totalKomitmen = 0;
    let totalTerkumpul = 0;
    let countLunas = 0;
    let countMenunggak = 0;
    let opzStats = [];
    
    const currentYearNum = parseInt(CURRENT_YEAR);
    const monthsArr = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    MOCK_IURAN_DATA.forEach(d => {
        const bergabung = parseBergabung(d.bergabung);
        let expectedMonths = 12;
        let expectedSemesters = 2;
        let expectedTahunan = 1;

        if (bergabung) {
            if (currentYearNum < bergabung.year) {
                return; // belum bergabung
            } else if (currentYearNum === bergabung.year) {
                expectedMonths = 12 - bergabung.month;
                expectedSemesters = bergabung.month < 6 ? 2 : 1;
            }
        }

        if (activeDashMonth !== 'all') {
            const mIdx = monthsArr.indexOf(activeDashMonth);
            if (bergabung && currentYearNum === bergabung.year && mIdx < bergabung.month) {
                return; // belum bergabung di bulan ini
            }
        }

        const isLunasLocal = isPaidForMonth(d, activeDashMonth);
        if (isLunasLocal) countLunas++;
        else countMenunggak++;

        let opzKomitmen = 0;
        let opzTerkumpul = 0;

        if (activeDashMonth === 'all') {
            let multiplier = 1;
            if (d.termin_pembayaran === 'Bulan') multiplier = expectedMonths;
            else if (d.termin_pembayaran === 'Semester') multiplier = expectedSemesters;
            else multiplier = expectedTahunan;

            const komitmenTahunan = d.target_iuran * multiplier;
            totalKomitmen += komitmenTahunan;
            opzKomitmen = komitmenTahunan;
            
            let checkedCount = 0;
            let perTermin = d.target_iuran;
            
            if (d.termin_pembayaran === 'Bulan') {
                const activeMonths = bergabung && currentYearNum === bergabung.year ? monthsArr.slice(bergabung.month) : monthsArr;
                activeMonths.forEach(m => { if(d.rincian_bayar[m]) checkedCount++; });
            } else if (d.termin_pembayaran === 'Semester') {
                const sems = bergabung && currentYearNum === bergabung.year && bergabung.month >= 6 ? ['Semester 2'] : ['Semester 1', 'Semester 2'];
                sems.forEach(s => { if(d.rincian_bayar[s]) checkedCount++; });
            } else {
                if(d.rincian_bayar['Tahunan']) checkedCount++;
            }
            
            opzTerkumpul = (checkedCount * perTermin);
            totalTerkumpul += opzTerkumpul;
        } else {
            totalKomitmen += d.target_iuran;
            opzKomitmen = d.target_iuran;
            if (isLunasLocal) {
                totalTerkumpul += d.target_iuran;
                opzTerkumpul = d.target_iuran;
            }
        }

        // Collect paid period labels for detail column
        let paidPeriods = [];
        if (activeDashMonth === 'all') {
            if (d.termin_pembayaran === 'Bulan') {
                const allM = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
                paidPeriods = allM.filter(m => d.rincian_bayar[m]);
            } else if (d.termin_pembayaran === 'Semester') {
                paidPeriods = ['Semester 1','Semester 2'].filter(s => d.rincian_bayar[s]);
            } else {
                paidPeriods = d.rincian_bayar['Tahunan'] ? ['Tahunan'] : [];
            }
        } else {
            if (d.termin_pembayaran === 'Bulan') {
                paidPeriods = d.rincian_bayar[activeDashMonth] ? [activeDashMonth] : [];
            } else if (d.termin_pembayaran === 'Semester') {
                const sem = ['Januari','Februari','Maret','April','Mei','Juni'].includes(activeDashMonth) ? 'Semester 1' : 'Semester 2';
                paidPeriods = d.rincian_bayar[sem] ? [sem] : [];
            } else {
                paidPeriods = d.rincian_bayar['Tahunan'] ? ['Tahunan'] : [];
            }
        }

        opzStats.push({
            nama: d.nama_lembaga,
            termin: d.termin_pembayaran,
            komitmen: opzKomitmen,
            terkumpul: opzTerkumpul,
            paidPeriods: paidPeriods,
            isLunas: isLunasLocal,
            persentase: opzKomitmen > 0 ? (opzTerkumpul / opzKomitmen) * 100 : 0
        });
    });

    const sisa = totalKomitmen - totalTerkumpul;
    const progress = totalKomitmen > 0 ? (totalTerkumpul / totalKomitmen) * 100 : 0;

    const elKomitmen = document.getElementById('dash-komitmen');
    const elTerkumpul = document.getElementById('dash-terkumpul');
    const elSisa = document.getElementById('dash-sisa');
    const elProgBar = document.getElementById('dash-progress-bar');
    const elProgText = document.getElementById('dash-progress-text');
    const elLunas = document.getElementById('dash-count-lunas');
    const elNunggak = document.getElementById('dash-count-menunggak');

    if(elKomitmen) elKomitmen.textContent = formatRupiah(totalKomitmen);
    if(elTerkumpul) elTerkumpul.textContent = formatRupiah(Math.round(totalTerkumpul));
    if(elSisa) elSisa.textContent = formatRupiah(Math.round(sisa));
    if(elProgBar) elProgBar.style.width = progress.toFixed(1) + '%';
    if(elProgText) elProgText.textContent = progress.toFixed(1) + '%';
    if(elLunas) elLunas.textContent = countLunas;
    if(elNunggak) elNunggak.textContent = countMenunggak;

    // Render OPZ Table
    const tbodyOpz = document.getElementById('dashboard-opz-tbody');
    if (tbodyOpz) {
        opzStats.sort((a, b) => b.persentase - a.persentase);
        tbodyOpz.innerHTML = opzStats.map(stat => {
            const statusBadge = stat.isLunas
                ? `<span class="badge badge-success">LUNAS</span>`
                : `<span class="badge badge-danger">BELUM</span>`;
            const periodeText = stat.paidPeriods.length > 0
                ? stat.paidPeriods.join(', ')
                : `<span style="color: var(--text-muted); font-style: italic;">-</span>`;
            const terminBadgeColor = stat.termin === 'Bulan' ? '#3B82F6' : stat.termin === 'Semester' ? '#8B5CF6' : '#F59E0B';
            return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="font-weight: 600;">${stat.nama}</td>
                <td><span style="font-size:0.75rem; background:${terminBadgeColor}; color:white; padding:2px 8px; border-radius:10px; white-space:nowrap;">${stat.termin}</span></td>
                <td>${formatRupiah(stat.komitmen)}</td>
                <td>${formatRupiah(stat.terkumpul)}</td>
                <td style="font-size: 0.82rem; color: var(--text-muted); max-width: 200px;">${periodeText}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="flex: 1; height: 8px; background-color: var(--border-color); border-radius: 4px; overflow: hidden; min-width: 80px;">
                            <div style="width: ${Math.min(stat.persentase,100)}%; height: 100%; background-color: ${stat.persentase >= 100 ? 'var(--primary)' : '#F59E0B'};"></div>
                        </div>
                        <span style="font-size: 0.85rem; font-weight: 600; min-width: 40px; text-align: right;">${stat.persentase.toFixed(1)}%</span>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    // Render Charts
    const ctxPendapatan = document.getElementById('pendapatanChart');
    const ctxPersentase = document.getElementById('persentaseChart');
    
    if (ctxPendapatan && ctxPersentase) {
        const years = ['2022', '2023', '2024', '2025', '2026'];
        const incomes = [];
        const targets = [];
        const lunasCounts = [];
        const lunasPercentages = [];

        years.forEach(yr => {
            let yearIncome = 0;
            let yearTarget = 0;
            let yearLunasCount = 0;
            let yearTotalCount = 0;

            if (MOCK_IURAN_DATA_YEARS[yr]) {
                const yrNum = parseInt(yr);
                MOCK_IURAN_DATA_YEARS[yr].forEach(d => {
                    const bergabung = parseBergabung(d.bergabung);
                    let expectedMonths = 12;
                    let expectedSemesters = 2;
                    let expectedTahunan = 1;

                    if (bergabung) {
                        if (yrNum < bergabung.year) {
                            return; // belum bergabung
                        } else if (yrNum === bergabung.year) {
                            expectedMonths = 12 - bergabung.month;
                            expectedSemesters = bergabung.month < 6 ? 2 : 1;
                        }
                    }

                    let multiplier = 1;
                    if (d.termin_pembayaran === 'Bulan') multiplier = expectedMonths;
                    else if (d.termin_pembayaran === 'Semester') multiplier = expectedSemesters;
                    else multiplier = expectedTahunan;
                    
                    yearTarget += (d.target_iuran * multiplier);

                    let checkedCount = 0;
                    if (d.termin_pembayaran === 'Bulan') {
                        const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
                        const activeMonths = bergabung && yrNum === bergabung.year ? months.slice(bergabung.month) : months;
                        activeMonths.forEach(m => { if(d.rincian_bayar[m]) checkedCount++; });
                    } else if (d.termin_pembayaran === 'Semester') {
                        const sems = bergabung && yrNum === bergabung.year && bergabung.month >= 6 ? ['Semester 2'] : ['Semester 1', 'Semester 2'];
                        sems.forEach(s => { if(d.rincian_bayar[s]) checkedCount++; });
                    } else {
                        if(d.rincian_bayar['Tahunan']) checkedCount++;
                    }
                    
                    yearIncome += (checkedCount * d.target_iuran);
                    
                    yearTotalCount++;
                    if (checkedCount > 0) yearLunasCount++;
                });
            }
            incomes.push(yearIncome);
            targets.push(yearTarget);
            lunasCounts.push(yearLunasCount);
            lunasPercentages.push(yearTotalCount > 0 ? ((yearLunasCount / yearTotalCount) * 100).toFixed(1) : 0);
        });

        if (pendapatanChartInstance) pendapatanChartInstance.destroy();
        pendapatanChartInstance = new Chart(ctxPendapatan, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        type: 'line',
                        label: 'Total Komitmen (Rp)',
                        data: targets,
                        borderColor: '#F59E0B',
                        backgroundColor: '#F59E0B',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3
                    },
                    {
                        type: 'bar',
                        label: 'Total Terkumpul (Rp)',
                        data: incomes,
                        backgroundColor: 'rgba(16, 185, 129, 0.6)',
                        borderColor: 'rgb(16, 185, 129)',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + (value/1000000).toFixed(0) + ' Jt';
                            }
                        }
                    }
                }
            }
        });

        if (persentaseChartInstance) persentaseChartInstance.destroy();
        persentaseChartInstance = new Chart(ctxPersentase, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        type: 'line',
                        label: 'Persentase Lunas (%)',
                        data: lunasPercentages,
                        borderColor: '#3B82F6',
                        backgroundColor: '#3B82F6',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3,
                        yAxisID: 'y1'
                    },
                    {
                        type: 'bar',
                        label: 'Jumlah OPZ Lunas',
                        data: lunasCounts,
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Jumlah OPZ' },
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Persentase (%)' },
                        beginAtZero: true,
                        max: 100,
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }
};

// ============================================
// DIREKTORI PIC DAN PIMPINAN
// ============================================
let DIRECTORY_DATA = [];

async function initDirectoryTables() {
    try {
        const res = await fetch('../data-zakat/pic_pimpinan.json');
        if (res.ok) {
            DIRECTORY_DATA = await res.json();
            renderPicTable();
            renderPimpinanTable();
        }
    } catch(e) {
        console.error("Gagal memuat data direktori:", e);
    }
}

function renderPicTable() {
    const tbody = document.getElementById('pic-table-body');
    if (!tbody) return;
    
    const searchPic = document.getElementById('search-pic');
    const query = searchPic ? searchPic.value.toLowerCase() : '';
    
    const filtered = DIRECTORY_DATA.filter(d => {
        const namaLembaga = d.nama_lembaga ? d.nama_lembaga.toLowerCase() : '';
        const namaPic = d.pic_keuangan.nama ? d.pic_keuangan.nama.toLowerCase() : '';
        return namaLembaga.includes(query) || namaPic.includes(query);
    });

    let html = '';
    filtered.forEach(d => {
        let kontak = d.pic_keuangan.kontak;
        if (kontak === '#REF!') kontak = '-';
        let wa = d.pic_keuangan.wa;
        if (wa === '#REF!') wa = '';
        
        let btnWa = wa ? `<a href="https://wa.me/${wa}" target="_blank" class="btn btn-sm" style="background-color: #25D366; color: white; margin-left: 10px; border-radius: 20px; font-weight: 600;"><i class="fab fa-whatsapp"></i> Chat WA</a>` : '';
        html += `
            <tr>
                <td><strong>${d.nama_lembaga}</strong></td>
                <td>${d.pic_keuangan.nama || '-'}</td>
                <td><span class="badge badge-info" style="background-color: var(--bg-hover); color: var(--text-main);">${d.pic_keuangan.jabatan || '-'}</span></td>
                <td>${kontak}${btnWa}</td>
            </tr>
        `;
    });
    
    if (filtered.length === 0) {
        html = '<tr><td colspan="4" style="text-align: center;">Tidak ada data ditemukan.</td></tr>';
    }
    tbody.innerHTML = html;
}

function renderPimpinanTable() {
    const tbody = document.getElementById('pimpinan-table-body');
    if (!tbody) return;
    
    const searchPimpinan = document.getElementById('search-pimpinan');
    const query = searchPimpinan ? searchPimpinan.value.toLowerCase() : '';
    
    const filtered = DIRECTORY_DATA.filter(d => {
        const namaLembaga = d.nama_lembaga ? d.nama_lembaga.toLowerCase() : '';
        const namaPimpinan = d.pimpinan.nama ? d.pimpinan.nama.toLowerCase() : '';
        return namaLembaga.includes(query) || namaPimpinan.includes(query);
    });

    let html = '';
    filtered.forEach(d => {
        let kontak = d.pimpinan.kontak;
        if (kontak === '#REF!') kontak = '-';
        let wa = d.pimpinan.wa;
        if (wa === '#REF!') wa = '';
        
        let btnWa = wa ? `<a href="https://wa.me/${wa}" target="_blank" class="btn btn-sm" style="background-color: #25D366; color: white; margin-left: 10px; border-radius: 20px; font-weight: 600;"><i class="fab fa-whatsapp"></i> Chat WA</a>` : '';
        html += `
            <tr>
                <td><strong>${d.nama_lembaga}</strong></td>
                <td>${d.pimpinan.nama || '-'}</td>
                <td><span class="badge badge-info" style="background-color: var(--bg-hover); color: var(--text-main);">${d.pimpinan.jabatan || '-'}</span></td>
                <td>${kontak}${btnWa}</td>
            </tr>
        `;
    });
    
    if (filtered.length === 0) {
        html = '<tr><td colspan="4" style="text-align: center;">Tidak ada data ditemukan.</td></tr>';
    }
    tbody.innerHTML = html;
}

// Attach event listeners after DOM is loaded or at script end
setTimeout(() => {
    const searchPic = document.getElementById('search-pic');
    if (searchPic) searchPic.addEventListener('input', renderPicTable);

    const searchPimpinan = document.getElementById('search-pimpinan');
    if (searchPimpinan) searchPimpinan.addEventListener('input', renderPimpinanTable);
    
    initDirectoryTables();
}, 100);
