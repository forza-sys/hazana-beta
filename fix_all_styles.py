import re
import os

files_to_fix = [
    'admin/lembaga.html',
    'unit-layanan-1/iuran-anggota.html',
    'executive/data-karantina.html'
]

combined_css = "\n/* Injected Styles from HTML files */\n"

for filepath in files_to_fix:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            html = f.read()
        
        # Extract style
        match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
        if match:
            css = match.group(1).strip()
            combined_css += f"\n/* Styles from {filepath} */\n" + css + "\n"
            
            # Remove style
            html = re.sub(r'\s*<style>.*?</style>\s*', '\n', html, flags=re.DOTALL)
            with open(filepath, 'w') as f:
                f.write(html)

with open('css/erp.css', 'a') as f:
    f.write(combined_css)
