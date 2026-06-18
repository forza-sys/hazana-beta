// sidebar.js untuk ERP (Admin / Executive)
(function() {
    // 1. Inject skeleton immediately so sidebar never "disappears"
    function injectSkeleton() {
        const container = document.getElementById('sidebar-container');
        if (!container || container.dataset.injected) return;
        
        container.dataset.injected = 'true';
        container.innerHTML = `
            <div class="mobile-header">
                <button id="mobile-menu-btn" class="menu-btn"><i class="fas fa-bars"></i></button>
                <div class="mobile-logo">HAZANA</div>
            </div>
            <aside class="sidebar collapsed" id="main-sidebar">
                <div class="sidebar-logo">
                    <button id="desktop-menu-btn" class="menu-btn"><i class="fas fa-bars"></i></button>
                    <div class="logo-icon"><i class="fas fa-cube"></i></div>
                    <span style="display: flex; flex-direction: column; justify-content: center;">
                        HAZANA
                    </span>
                </div>
                <div id="sidebar-menu-container"></div>
                <div style="flex-grow: 1;"></div>
                <ul class="sidebar-menu" style="margin-bottom: 1.5rem;">
                    <li><a href="#" onclick="HazanaAuth.logout()"><i class="fas fa-sign-out-alt"></i> <span>Keluar</span></a></li>
                </ul>
            </aside>
        `;
        
        // Setup events immediately on the skeleton
        initSidebarEvents();
    }

    function renderMenu() {
        const user = window.HAZANA_USER;
        if (!user) {
            setTimeout(renderMenu, 100);
            return;
        }

        const isSubFolder = window.location.pathname.split('/').some(p => ['admin', 'member', 'sekretariat', 'executive', 'unit-layanan-1'].includes(p));
        const base = isSubFolder ? '../' : './';

        let menuHTML = '';
        if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN_IT') {
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
                    <li><a href="${base}data-zakat/kurban.html"><i class="fas fa-chart-line"></i> <span>Dashboard Data Zakat</span></a></li>
                    <li><a href="${base}executive/data-karantina.html"><i class="fas fa-shield-virus"></i> <span>Karantina Data</span></a></li>
                </ul>
            `;
        }

        const menuContainer = document.getElementById('sidebar-menu-container');
        if (menuContainer) {
            menuContainer.innerHTML = menuHTML;
        }

        // Set active menu based on current URL
        const currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';
        document.querySelectorAll('.sidebar-menu a').forEach(a => {
            const href = a.getAttribute('href');
            if (href && href.includes(currentFile)) {
                a.parentElement.classList.add('active');
            }
            
            // PJAX Navigation Intercept
            a.addEventListener('click', async (e) => {
                const targetHref = a.getAttribute('href');
                if (!targetHref || targetHref === '#' || targetHref.startsWith('javascript:') || a.getAttribute('target') === '_blank') return;
                
                e.preventDefault();
                
                const sidebar = document.getElementById('main-sidebar');
                if (window.innerWidth <= 768 && sidebar) {
                    sidebar.classList.remove('open');
                }

                const currentMc = document.querySelector('.main-content');
                if (currentMc) currentMc.classList.add('page-fade-out');

                // Update active menu visually
                document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
                a.parentElement.classList.add('active');

                setTimeout(async () => {
                    try {
                        const res = await fetch(targetHref);
                        const html = await res.text();
                        const doc = new DOMParser().parseFromString(html, 'text/html');
                        
                        // Replace main content
                        const newMc = doc.querySelector('.main-content');
                        if (newMc && currentMc) {
                            currentMc.replaceWith(newMc);
                            newMc.classList.remove('page-fade-out');
                        }
                        
                        // Replace modals (if any)
                        const currentModals = document.querySelectorAll('.modal');
                        currentModals.forEach(m => m.remove());
                        const newModals = doc.querySelectorAll('.modal');
                        newModals.forEach(m => document.body.appendChild(m));
                        
                        document.title = doc.title;
                        document.body.className = doc.body.className;
                        window.history.pushState({}, '', targetHref);
                        
                        // Execute Scripts outside main content (specifically core JS)
                        const scripts = doc.querySelectorAll('script');
                        scripts.forEach(oldScript => {
                            if (oldScript.src && !oldScript.src.includes('sidebar.js') && !oldScript.src.includes('auth.js') && !oldScript.src.includes('supabase-config.js')) {
                                // Re-inject script so browser executes it
                                const s = document.createElement('script');
                                s.src = oldScript.src;
                                document.body.appendChild(s);
                            }
                        });
                        
                        // Dispatch event to re-initialize page logic
                        window.dispatchEvent(new CustomEvent('hazana:pjax-loaded'));
                        
                    } catch (error) {
                        console.error('PJAX Error:', error);
                        window.location.href = targetHref;
                    }
                }, 150);
            });
        });
    }

    function initSidebarEvents() {
        const sidebar = document.getElementById('main-sidebar');
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
        const sidebar = document.getElementById('main-sidebar');
        if (activeMc && sidebar) {
            if (sidebar.classList.contains('collapsed')) {
                activeMc.classList.add('expanded');
            } else {
                activeMc.classList.remove('expanded');
            }
        }
    }

    // Inject skeleton synchronously if possible
    injectSkeleton();

    document.addEventListener('DOMContentLoaded', () => {
        injectSkeleton(); // In case container wasn't ready earlier
        renderMenu();
    });
})();
