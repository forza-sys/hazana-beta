import re

with open('js/sidebar.js', 'r') as f:
    content = f.read()

pjax_code = """        // Set active menu based on current URL
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
        });"""

content = re.sub(r'        // Set active menu based on current URL.*?(?=\s+})\s+}', pjax_code + '\n    }\n', content, flags=re.DOTALL)

with open('js/sidebar.js', 'w') as f:
    f.write(content)
