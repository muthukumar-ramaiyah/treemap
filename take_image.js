const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set viewport to a larger size for better screenshot quality
    // This can help with sharper fonts and better rendering
    // Adjust the width and height as needed

    await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 2   // Increase for sharper fonts
    });
    // Load your treemap HTML
    await page.goto(`file://${__dirname}/output.html`, { waitUntil: 'networkidle0' });

    // Sleep for 1 second to ensure all elements are loaded
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Select the element you want to capture
    const element = await page.$('#treemap-area');

    // Take screenshot of only that element
    await element.screenshot({ path: 'treemap.jpeg', type: 'jpeg', quality: 40 });

    // Take screenshot
    // await page.screenshot({ path: 'treemap.png' });

    await browser.close();
    console.log('Screenshot saved as treemap.png');
})();
