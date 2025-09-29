Got it ✅ You can absolutely do this with the Confluence REST APIs. The flow is:

1. **Attach the HTML file** to a Confluence page.
2. **Embed a download link** in the page body that points to the attachment.

Here’s how you can do it step by step:

---

### 1. Upload the HTML file as an attachment

```bash
curl -u user@example.com:API_TOKEN \
  -X POST \
  -H "X-Atlassian-Token: nocheck" \
  -F "file=@output.html" \
  "https://your-domain.atlassian.net/wiki/rest/api/content/{PAGE_ID}/child/attachment"
```

This will upload `output.html` as an attachment to the given page.

---

### 2. Update page body with a download link

The attachment will be accessible under:

```
/wiki/download/attachments/{PAGE_ID}/output.html
```

So your page payload can include:

```json
{
  "id": "PAGE_ID",
  "type": "page",
  "title": "Treemap Report",
  "space": { "key": "SPACE_KEY" },
  "body": {
    "storage": {
      "value": "<p>Download the report: <a href='/wiki/download/attachments/PAGE_ID/output.html'>Treemap Report</a></p>",
      "representation": "storage"
    }
  },
  "version": { "number": 2 }
}
```

⚡️ Confluence will automatically render the `<a>` link as a **downloadable file** link for users.

---

### 3. Optional – Make it look nicer

Instead of plain text, you can also use Confluence macros in storage format, e.g. the **`<ac:link>` macro** for attachments:

```xml
<ac:link>
  <ri:attachment ri:filename="output.html"/>
  <ac:plain-text-link-body><![CDATA[Download Treemap Report]]></ac:plain-text-link-body>
</ac:link>
```

---

👉 This way:

* The HTML file is **stored as an attachment** to the page.
* Users get a **clickable download link** in the Confluence page itself.

Do you want me to write you a **Node.js script** that takes your `output.html` and automatically uploads + links it in Confluence via REST API?

---
Perfect 👌 Since you’re already comfortable with **PactumJS**, we can use its REST client to do both steps:

1. Upload the `output.html` as an attachment.
2. Update the Confluence page body with a download link.

Here’s a working Node.js example:

```js
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
        value: `<p>Download the report: <a href="${downloadLink}">Treemap Report</a></p>`,
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
```

---

🔑 Notes:

* Replace `your-domain`, `SPACE_KEY`, `PAGE_ID`, `user@example.com`, and `API_TOKEN` with your own.
* `version.number` must always be incremented (I used `2` here, but you can fetch the current version and +1 dynamically).
* After this runs, users will see a clickable **Download Treemap Report** link on the page.

👉 Do you want me to extend this so it **automatically fetches the current page version** before updating (so you don’t have to hardcode `version: { number: 2 }`)?
