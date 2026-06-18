const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8080/test_minimal.html', { waitUntil: 'networkidle0' });
  
  const sidebarDisplay = await page.evaluate(() => {
    const el = document.querySelector('.sidebar.collapsed');
    if (!el) return 'NOT FOUND';
    const style = window.getComputedStyle(el);
    return {
      display: style.display,
      width: style.width,
      opacity: style.opacity,
      visibility: style.visibility,
      left: style.left,
      transform: style.transform,
      zIndex: style.zIndex
    };
  });
  
  console.log(sidebarDisplay);
  await browser.close();
})();
