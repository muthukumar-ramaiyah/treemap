const fs = require('fs');
const pactum = require('pactum');

const BASE_URL = 'https://your-domain.atlassian.net/wiki/rest/api';
const SPACE_KEY = 'YOUR_SPACE_KEY';
const PAGE_ID = 'YOUR_PAGE_ID';
const USER_EMAIL = 'user@example.com';
const API_TOKEN = 'your_api_token';

// Attach HTML file to Confluence page
async function uploadAttachment() {
    await pactum.spec()
        .post(`${BASE_URL}/content/${PAGE_ID}/child/attachment`)
        .withHeaders({
            'Authorization': 'Basic ' + Buffer.from(`${USER_EMAIL}:${API_TOKEN}`).toString('base64'),
            'X-Atlassian-Token': 'nocheck'
        })
        .withMultiPartFormData('file', fs.createReadStream('output.html'))
        .expectStatus(200);

    console.log('✅ HTML file attached successfully');
}

// Update page body to add download link
async function updatePageBody() {
    const downloadLink = `/wiki/download/attachments/${PAGE_ID}/output.html`;

    const payload = {
        id: PAGE_ID,
        type: 'page',
        title: 'Treemap Report',
        space: { key: SPACE_KEY },
        body: {
            storage: {
                value: `<ac:link>
  <ri:attachment ri:filename="output.html"/>
  <ac:plain-text-link-body><![CDATA[Download Treemap Report]]></ac:plain-text-link-body>
</ac:link>`,
                representation: 'storage'
            }
        },
        version: { number: 2 } // increment this each update
    };

    await pactum.spec()
        .put(`${BASE_URL}/content/${PAGE_ID}`)
        .withHeaders({
            'Authorization': 'Basic ' + Buffer.from(`${USER_EMAIL}:${API_TOKEN}`).toString('base64'),
            'Content-Type': 'application/json'
        })
        .withJson(payload)
        .expectStatus(200);

    console.log('✅ Page updated with download link');
}

// Run both steps
(async () => {
    try {
        await uploadAttachment();
        await updatePageBody();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
})();

