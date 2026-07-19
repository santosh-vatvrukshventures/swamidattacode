import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  await page.goto('https://swamidatta.vercel.app/');
  
  await page.waitForSelector('button');
  
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('button, a'));
    const invNav = navs.find(n => n.innerText && n.innerText.includes('Inventory'));
    if (invNav) invNav.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const editBtn = buttons.find(b => b.innerText && b.innerText.includes('Edit Rates'));
    if (editBtn) editBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'test_screenshot.png' });
  
  await browser.close();
})();
