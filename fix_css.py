import sys

with open('/tmp/kurban_sidebar.css', 'r') as f:
    kurban_css = f.read()

# Replace colors
kurban_css = kurban_css.replace('linear-gradient(135deg, #1fb56b 0%, #10854d 100%)', 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)')
kurban_css = kurban_css.replace('color: #10854d;', 'color: var(--primary-dark);')
kurban_css = kurban_css.replace('background-color: #dcfce7;\n  color: #166534;', 'background-color: white;\n  color: var(--primary-dark);')

with open('css/erp.css', 'r') as f:
    erp_css = f.read()

# Find the start of .mobile-header { display: none; } and the end of the file
start_idx = erp_css.find('.mobile-header { display: none; }')
if start_idx == -1:
    print("Could not find start index")
    sys.exit(1)

new_erp_css = erp_css[:start_idx] + kurban_css

with open('css/erp.css', 'w') as f:
    f.write(new_erp_css)
print("Success")
