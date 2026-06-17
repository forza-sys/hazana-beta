// sidebar.js untuk ERP (Admin / Executive)
(function() {
    function renderSidebar() {
        const user = window.HAZANA_USER;
        if (!user) {
            setTimeout(renderSidebar, 100);
            return;
        }

        let menuHTML = '';
        if (user.role === 'ADMIN_FOZ') {
            menuHTML = `
                <div class="menu-label">MANAJEMEN IT</div>
                <ul class="sidebar-menu">
                    <li><a href="dashboard.html"><i class="fas fa-users-cog"></i> <span>Verifikasi Akun</span></a></li>
                    <li><a href="lembaga.html"><i class="fas fa-building"></i> <span>Database Lembaga</span></a></li>
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
                    <li><a href="dashboard.html"><i class="fas fa-money-check-alt"></i> <span>Dasbor Iuran</span></a></li>
                    <li><a href="iuran.html"><i class="fas fa-file-invoice-dollar"></i> <span>Manajemen Iuran</span></a></li>
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
                <div class="mobile-logo">HAZANA ERP</div>
            </div>
            <aside class="sidebar collapsed">
                <div class="sidebar-logo">
                    <button id="desktop-menu-btn" class="menu-btn"><i class="fas fa-bars"></i></button>
                    <div class="logo-icon"><i class="fas fa-cube"></i></div>
                    <span style="display: flex; flex-direction: column; justify-content: center;">
                        HAZANA
                        <small style="font-size: 0.6rem; font-weight: 500; letter-spacing: 0.5px; opacity: 0.9; margin-top: -2px;">ERP System</small>
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
        const desktopBtn = document.getElementById('desktop-menu-btn');
        const mobileBtn = document.getElementById('mobile-menu-btn');
        
        const savedState = localStorage.getItem('sidebarState');
        if (savedState === 'expanded' && window.innerWidth > 768) {
            sidebar.classList.remove('collapsed');
            updateMainContentState();
        }

        if (desktopBtn && mobileBtn && sidebar) {
            desktopBtn.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                } else {
                    sidebar.classList.toggle('collapsed');
                    updateMainContentState();
                    const isCollapsed = sidebar.classList.contains('collapsed');
                    localStorage.setItem('sidebarState', isCollapsed ? 'collapsed' : 'expanded');
                }
            });

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
