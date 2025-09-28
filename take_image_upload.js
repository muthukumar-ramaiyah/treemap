const fs = require('fs');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

const CONFLUENCE_BASE_URL = 'https://your-domain.atlassian.net/wiki';
const SPACE_KEY = 'YOUR_SPACE_KEY';
const PAGE_ID = '123456'; // existing Confluence page ID
const USERNAME = 'your-email@example.com';
const API_TOKEN = 'your-api-token';

// Step 1: Generate HTML (you already do this as output.html)

// Step 2: Take screenshot of treemap
async function captureTreemapScreenshot() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`file://${__dirname}/output.html`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'treemap.png' });
  await browser.close();
  console.log('✅ Screenshot saved as treemap.png');
}

// Step 3: Upload screenshot as attachment to Confluence
async function uploadAttachment() {
  const fileData = fs.createReadStream('treemap.png');
  const url = `${CONFLUENCE_BASE_URL}/rest/api/content/${PAGE_ID}/child/attachment`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${USERNAME}:${API_TOKEN}`).toString('base64'),
      'X-Atlassian-Token': 'nocheck'
    },
    body: new FormData().append('file', fileData, 'treemap.png')
  });

  const result = await response.json();
  if (response.ok) {
    console.log('✅ Uploaded treemap.png to Confluence');
    return result.results[0].title;
  } else {
    console.error('❌ Upload failed:', result);
    throw new Error(result.message);
  }
}

// Step 4: Update Confluence page body to show image
async function updateConfluencePage(filename) {
  const url = `${CONFLUENCE_BASE_URL}/rest/api/content/${PAGE_ID}`;
  const pageResp = await fetch(url, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${USERNAME}:${API_TOKEN}`).toString('base64'),
      'Accept': 'application/json'
    }
  });
  const pageData = await pageResp.json();

  const newVersion = pageData.version.number + 1;
  const payload = {
    id: PAGE_ID,
    type: 'page',
    title: pageData.title,
    version: { number: newVersion },
    body: {
      storage: {
        value: `<ac:image><ri:attachment ri:filename="${filename}" /></ac:image>`,
        representation: 'storage'
      }
    }
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${USERNAME}:${API_TOKEN}`).toString('base64'),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    console.log(`✅ Page updated to include image ${filename}`);
  } else {
    const err = await response.json();
    console.error('❌ Failed to update page:', err);
  }
}

// Run end-to-end flow
(async () => {
  await captureTreemapScreenshot();
  const filename = await uploadAttachment();
  await updateConfluencePage(filename);
})();
