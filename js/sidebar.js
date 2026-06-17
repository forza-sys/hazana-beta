// sidebar.js untuk ERP (Admin / Executive)
(function() {
    function renderSidebar() {
        const user = window.HAZANA_USER;
        if (!user) {
            setTimeout(renderSidebar, 100);
            return;
        }

        const isSubFolder = window.location.pathname.split('/').some(p => ['admin', 'member', 'sekretariat', 'executive', 'unit-layanan-1'].includes(p));
        const base = isSubFolder ? '../' : './';

        let menuHTML = '';
        if (user.role === 'SUPER_ADMIN') {
            menuHTML = `
                <ul class="sidebar-menu">
                    <li><a href="${base}admin/lembaga.html"><i class="fas fa-building"></i> <span>Lembaga</span></a></li>
                    <li><a href="${base}admin/dashboard.html"><i class="fas fa-users-cog"></i> <span>Akun</span></a></li>
                    <li><a href="${base}admin/portal.html"><i class="fas fa-th-large"></i> <span>Modul</span></a></li>
                </ul>
            `;
        } else if (user.role === 'TIM_SEKRETARIAT') {
            menuHTML = `
                <div class="menu-label">SEKRETARIAT FOZ</div>
                <ul class="sidebar-menu">
                    <li><a href="dashboard.html"><i class="fas fa-id-card"></i> <span>Data Keanggotaan</span></a></li>
                </ul>
            `;
        } else if (user.role === 'UNIT_LAYANAN_1') {
            menuHTML = `
                <div class="menu-label">UNIT LAYANAN 1</div>
                <ul class="sidebar-menu">
                    <li><a href="iuran-anggota.html"><i class="fas fa-file-invoice-dollar"></i> <span>Iuran Anggota</span></a></li>
                </ul>
            `;
        } else {
            menuHTML = `
                <div class="menu-label">TIM EKSEKUTIF</div>
                <ul class="sidebar-menu">
                    <li><a href="dashboard.html"><i class="fas fa-chart-line"></i> <span>Dashboard ZIS</span></a></li>
                    <li><a href="data-karantina.html"><i class="fas fa-shield-virus"></i> <span>Karantina Data</span></a></li>
                </ul>
            `;
        }

        const sidebarHTML = `
            <div class="mobile-header">
                <button id="mobile-menu-btn" class="menu-btn"><i class="fas fa-bars"></i></button>
                <div class="mobile-logo">HAZANA</div>
            </div>
            <aside class="sidebar collapsed">
                <div class="sidebar-logo">
                    <div class="logo-icon"><i class="fas fa-cube"></i></div>
                    <span style="display: flex; flex-direction: column; justify-content: center;">
                        HAZANA
                    </span>
                </div>
                ${menuHTML}
                
                <div style="flex-grow: 1;"></div>
                <ul class="sidebar-menu" style="margin-bottom: 1.5rem;">
                    <li><a href="#" onclick="HazanaAuth.logout()"><i class="fas fa-sign-out-alt"></i> <span>Keluar</span></a></li>
                </ul>
            </aside>
        `;

        const container = document.getElementById('sidebar-container');
        if (container) {
            container.innerHTML = sidebarHTML;
        }

        // Set active menu based on current URL
        const currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';
        document.querySelectorAll('.sidebar-menu a').forEach(a => {
            if (a.getAttribute('href') === currentFile) {
                a.parentElement.classList.add('active');
            }
        });

        initSidebarEvents();
    }

    function initSidebarEvents() {
        const sidebar = document.querySelector('.sidebar');
        const mobileBtn = document.getElementById('mobile-menu-btn');
        if (mobileBtn && sidebar) {
            mobileBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
    }

    function updateMainContentState() {
        const activeMc = document.querySelector('.main-content');
        const sidebar = document.querySelector('.sidebar');
        if (activeMc && sidebar) {
            if (sidebar.classList.contains('collapsed')) {
                activeMc.classList.add('expanded');
            } else {
                activeMc.classList.remove('expanded');
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Render will wait for HAZANA_USER
        renderSidebar();
    });
})();
