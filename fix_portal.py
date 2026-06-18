import re

# Read portal.css
with open('/tmp/portal.css', 'r') as f:
    css_content = f.read()

# Remove <style> tags
css_content = css_content.replace('<style>', '').replace('</style>', '').strip()

# Append to erp.css
with open('css/erp.css', 'a') as f:
    f.write('\n/* Portal Styles */\n' + css_content + '\n')

# Remove from portal.html
with open('admin/portal.html', 'r') as f:
    html_content = f.read()

html_content = re.sub(r'\s*<style>.*?</style>\s*', '\n', html_content, flags=re.DOTALL)

with open('admin/portal.html', 'w') as f:
    f.write(html_content)
