import re

with open('js/sidebar.js', 'r') as f:
    content = f.read()

# Replace menu items
hazana_menu = """
      let menuHTML = '';
      if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN_IT') {
          menuHTML = `
              <ul class="sidebar-menu">
                  <li><a href="${base}admin/lembaga.html"><i class="fas fa-building"></i> <span>Lembaga</span></a></li>
                  <li><a href="${base}admin/dashboard.html"><i class="fas fa-users-cog"></i> <span>Akun</span></a></li>
                  <li><a href="${base}admin/portal.html"><i class="fas fa-th-large"></i> <span>Modul</span></a></li>
              </ul>
          `;
      } else if (userRole === 'TIM_SEKRETARIAT') {
          menuHTML = `
              <div class="menu-label">SEKRETARIAT FOZ</div>
              <ul class="sidebar-menu">
                  <li><a href="dashboard.html"><i class="fas fa-id-card"></i> <span>Data Keanggotaan</span></a></li>
              </ul>
          `;
      } else if (userRole === 'UNIT_LAYANAN_1') {
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
"""

content = re.sub(
    r"let menuHTML = '';.*?if \(userRole === 'ADMIN_IT' || userRole === 'SUPER_ADMIN'\) \{.*?\};",
    hazana_menu.strip(),
    content,
    flags=re.DOTALL
)

# Replace "Kurban OPZ" with "HAZANA"
content = content.replace("Kurban OPZ", "HAZANA")

# We must replace `user = JSON.parse(localStorage.getItem('kurban_user'));` with HAZANA_USER
content = re.sub(
    r"const user = JSON\.parse\(localStorage\.getItem\('kurban_user'\)\);.*?const userRole = user \? user\.role : null;",
    """
    const user = window.HAZANA_USER;
    const userRole = user ? user.role : null;
    """,
    content,
    flags=re.DOTALL
)

# HazanaAuth.logout instead of localStorage.removeItem
content = content.replace(
    """<li><a href="#" onclick="localStorage.removeItem('kurban_user'); window.location.href='index.html';"><i class="fas fa-sign-out-alt"></i> <span>Keluar</span></a></li>""",
    """<li><a href="#" onclick="HazanaAuth.logout()"><i class="fas fa-sign-out-alt"></i> <span>Keluar</span></a></li>"""
)

with open('js/sidebar.js', 'w') as f:
    f.write(content)
