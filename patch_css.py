import re

with open('css/erp.css', 'r') as f:
    erp_css = f.read()

with open('/Users/samudra/Library/CloudStorage/OneDrive-ForumZakat/Downloads/Kurban OPZ/2026/data-zakat/kurban2026.css', 'r') as f:
    kurban_css = f.read()

# Extract from /* Dashboard Layout & Sidebar */ to .app-container
kurban_sidebar = re.search(r'/\* Dashboard Layout & Sidebar \*/.*?(?=\.app-container \{)', kurban_css, re.DOTALL).group(0)

# Replace green colors in Kurban's sidebar with Hazana's blue colors
kurban_sidebar = kurban_sidebar.replace('linear-gradient(135deg, #1fb56b 0%, #10854d 100%)', 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)')
kurban_sidebar = kurban_sidebar.replace('#10854d', '#1e3a8a') # Logo and mobile menu color
kurban_sidebar = kurban_sidebar.replace('background-color: #dcfce7;', 'background-color: white;')
kurban_sidebar = kurban_sidebar.replace('color: #166534;', 'color: #1e3a8a;')

# Do the same for erp_css
erp_css = re.sub(r'/\* Dashboard Layout & Sidebar \*/.*?(?=\.app-container \{)', kurban_sidebar, erp_css, flags=re.DOTALL)

with open('css/erp.css', 'w') as f:
    f.write(erp_css)
