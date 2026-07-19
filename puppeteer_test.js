import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  
  await page.goto('https://swamidatta.vercel.app/');
  
  // Wait for the app to load
  await page.waitForSelector('button');
  
  // Wait for "Inventory Stock" to be visible
  // It might be a nav button
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('button, a'));
    const invNav = navs.find(n => n.innerText && n.innerText.includes('Inventory'));
    if (invNav) invNav.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Clicking Edit Rates button...");
  
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const editBtn = buttons.find(b => b.innerText && b.innerText.includes('Edit Rates'));
    if (editBtn) editBtn.click();
    else console.log("Edit Rates button not found!");
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
