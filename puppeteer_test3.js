import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  let pageError = null;
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
    pageError = err.message;
  });
  
  await page.goto('https://swamidatta.vercel.app/');
  await page.waitForSelector('button');
  
  await page.evaluate(() => {
    const navs = Array.from(document.querySelectorAll('button, a'));
    const invNav = navs.find(n => n.innerText && n.innerText.includes('Inventory'));
    if (invNav) invNav.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  const buttonsCount = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).filter(b => b.innerText && b.innerText.includes('Edit Rates')).length;
  });
  
  console.log(`Found ${buttonsCount} Edit Rates buttons. Checking them all...`);
  
  for (let i = 0; i < buttonsCount; i++) {
    await page.evaluate((idx) => {
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText && b.innerText.includes('Edit Rates'));
      if (btns[idx]) btns[idx].click();
    }, i);
    
    await new Promise(r => setTimeout(r, 500));
    if (pageError) {
      console.log(`Crashed on button ${i}! Error: ${pageError}`);
      break;
    }
    
    // Close the modal
    await page.evaluate(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
  }
  
  if (!pageError) console.log("All buttons clicked without error.");
  await browser.close();
})();
