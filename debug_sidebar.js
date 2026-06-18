const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Intercept console messages
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:8080/admin/lembaga.html', { waitUntil: 'networkidle0' });
  
  const sidebarExists = await page.evaluate(() => {
    return !!document.querySelector('.sidebar');
  });
  
  console.log('Sidebar exists in DOM?', sidebarExists);
  
  if (sidebarExists) {
    const style = await page.evaluate(() => {
      const el = document.querySelector('.sidebar');
      const s = window.getComputedStyle(el);
      return {
        width: s.width,
        height: s.height,
        display: s.display,
        visibility: s.visibility,
        opacity: s.opacity,
        left: s.left,
        top: s.top,
        transform: s.transform,
        zIndex: s.zIndex
      };
    });
    console.log('Sidebar Computed Style:', style);
    
    const container = await page.evaluate(() => {
      return document.getElementById('sidebar-container').innerHTML.substring(0, 100);
    });
    console.log('Sidebar container innerHTML start:', container);
  } else {
    const container = await page.evaluate(() => {
      const el = document.getElementById('sidebar-container');
      return el ? 'EXISTS BUT EMPTY' : 'DOES NOT EXIST';
    });
    console.log('Sidebar container status:', container);
  }
  
  await browser.close();
})();
