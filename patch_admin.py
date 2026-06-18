import re

with open('admin/js/admin-core.js', 'r') as f:
    content = f.read()

# The replace tool broke it, let's fix it by finding where it was supposed to close.
# The original code ended the `});` right before `async function initAdmin() {`
content = re.sub(
    r'    setTimeout\(\(\) => \{.*?\};\n    \}\), 1000\);\n',
    '    setTimeout(() => {\n        if (document.getElementById("user-name") && (!document.getElementById("user-name").textContent || document.getElementById("user-name").textContent === "Memuat...")) {\n            document.getElementById("user-name").textContent = "Admin (Test)";\n            document.getElementById("user-role").textContent = "SUPER_ADMIN";\n            renderMockSekretariat();\n            renderMockLembaga();\n        }\n    }, 1000);\n}\n\nif (document.readyState === "loading") {\n    document.addEventListener("DOMContentLoaded", bootAdminPage);\n} else {\n    bootAdminPage();\n}\nwindow.addEventListener("hazana:pjax-loaded", bootAdminPage);\n\n',
    content,
    flags=re.DOTALL
)

with open('admin/js/admin-core.js', 'w') as f:
    f.write(content)
