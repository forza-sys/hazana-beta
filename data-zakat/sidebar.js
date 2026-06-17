// sidebar.js
(function() {
  // Define Sidebar HTML
  const sidebarHTML = `
    <div class="mobile-header">
      <button id="mobile-menu-btn" class="menu-btn"><i class="fas fa-bars"></i></button>
      <div class="mobile-logo">HAZANA</div>
    </div>
    <aside class="sidebar collapsed">
      <div class="sidebar-logo">
        <button id="desktop-menu-btn" class="menu-btn"><i class="fas fa-bars"></i></button>
        <div class="logo-icon">H</div>
        <span style="display: flex; flex-direction: column; justify-content: center;">
          HAZANA
          <small style="font-size: 0.5rem; font-weight: 500; letter-spacing: 0.5px; opacity: 0.9; margin-top: -2px;">by Forum Zakat</small>
        </span>
      </div>
      <ul class="sidebar-menu">
        <li><a href="kurban.html"><i class="fas fa-cow"></i> <span>Kurban 1447 H</span></a></li>
        <li><a href="ramadan.html"><i class="fas fa-moon"></i> <span>Ramadan 1447 H</span></a></li>
      </ul>
      <div style="flex-grow: 1;"></div>
      <ul class="sidebar-menu" style="margin-bottom: 1.5rem;">
        <li><a href="hazana-pitchdeck.html" target="_blank"><i class="fas fa-info-circle"></i> <span style="line-height: 1.2;">About HAZANA<br><small style="font-weight: 500; font-size: 0.6rem; opacity: 0.8;">Harmoni Zakat Nasional</small></span></a></li>
      </ul>
    </aside>
  `;

  // Inject HTML synchronously
  const container = document.getElementById('sidebar-container');
  if (container) {
    container.innerHTML = sidebarHTML;
  }

  // Set active menu based on current URL
  const currentFile = window.location.pathname.split('/').pop() || 'kurban.html';
  document.querySelectorAll('.sidebar-menu a').forEach(a => {
    if (a.getAttribute('href') === currentFile) {
      a.parentElement.classList.add('active');
    }
  });

  // Apply saved state before first render to prevent FOUC
  const savedState = localStorage.getItem('sidebarState');
  if (savedState === 'expanded' && window.innerWidth > 768) {
    document.querySelector('.sidebar').classList.remove('collapsed');
    const mc = document.querySelector('.main-content');
    if (mc) mc.classList.remove('expanded');
  }

  // Initialize Sidebar Interaction and PJAX
  function initSidebar() {
    if (window.spaInitialized) return;
    window.spaInitialized = true;
    window.pageCache = {};
    
    const sidebar = document.querySelector('.sidebar');
    const desktopBtn = document.getElementById('desktop-menu-btn');
    const mobileBtn = document.getElementById('mobile-menu-btn');
    
    // Save current page to cache
    window.pageCache[currentFile] = {
       content: document.querySelector('.main-content'),
       title: document.title
    };

    if (desktopBtn && mobileBtn && sidebar) {
      desktopBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
        } else {
          sidebar.classList.toggle('collapsed');
          updateMainContentState();
          
          // Save state
          const isCollapsed = sidebar.classList.contains('collapsed');
          localStorage.setItem('sidebarState', isCollapsed ? 'collapsed' : 'expanded');
        }
      });

      mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });

      // Close sidebar on mobile when clicking outside
      document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
          if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
            sidebar.classList.remove('open');
          }
        }
      });

      // PJAX Navigation
      const menuLinks = document.querySelectorAll('.sidebar-menu a');
      menuLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
          const targetHref = link.getAttribute('href');
          if (!targetHref || targetHref === '#' || targetHref.startsWith('javascript:') || link.getAttribute('target') === '_blank') return;
          
          e.preventDefault();
          
          if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
          }

          const currentMc = document.querySelector('.main-content');
          if (currentMc) currentMc.classList.add('page-fade-out');

          // Update active menu visually
          document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
          link.parentElement.classList.add('active');

          setTimeout(async () => {
             const targetFile = targetHref.split('/').pop();
             
             if (window.pageCache[targetFile]) {
                // Restore from Cache
                if (currentMc) currentMc.replaceWith(window.pageCache[targetFile].content);
                window.pageCache[targetFile].content.classList.remove('page-fade-out');
                document.title = window.pageCache[targetFile].title;
                window.history.pushState({}, '', targetHref);
             } else {
                // Fetch new page
                try {
                    const res = await fetch(targetHref);
                    const html = await res.text();
                    const doc = new DOMParser().parseFromString(html, 'text/html');
                    const newMc = doc.querySelector('.main-content');
                    
                    if (newMc) {
                        if (currentMc) currentMc.replaceWith(newMc);
                        newMc.classList.remove('page-fade-out');
                        document.title = doc.title;
                        window.history.pushState({}, '', targetHref);
                        
                        // Cache it
                        window.pageCache[targetFile] = {
                           content: newMc,
                           title: doc.title
                        };
                        
                        // Execute Scripts inside new content
                        const scripts = newMc.querySelectorAll('script');
                        scripts.forEach(oldScript => {
                            if (oldScript.src) {
                                if (!document.querySelector(`script[src="${oldScript.src}"]`)) {
                                    const s = document.createElement('script');
                                    s.src = oldScript.src;
                                    document.head.appendChild(s);
                                }
                            } else {
                                const newScript = document.createElement('script');
                                newScript.textContent = oldScript.innerHTML;
                                document.body.appendChild(newScript);
                            }
                        });
                    } else {
                        window.location.href = targetHref;
                    }
                 } catch (err) {
                    window.location.href = targetHref;
                }
             }
             
             updateMainContentState();
          }, 300);
        });
      });
      
      // Handle Back Button
      window.addEventListener('popstate', () => {
          const currentFile = window.location.pathname.split('/').pop() || 'kurban.html';
          if (window.pageCache[currentFile]) {
             const currentMc = document.querySelector('.main-content');
             if (currentMc) currentMc.replaceWith(window.pageCache[currentFile].content);
             window.pageCache[currentFile].content.classList.remove('page-fade-out');
             document.title = window.pageCache[currentFile].title;
             
             // Update sidebar active item
             document.querySelectorAll('.sidebar-menu a').forEach(a => {
                 if (a.getAttribute('href') === currentFile) {
                     document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
                     a.parentElement.classList.add('active');
                 }
             });
             
             updateMainContentState();
          } else {
             window.location.reload();
          }
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

  // Initialize after DOM is fully ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }
})();
