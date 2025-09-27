const fs = require('fs');

function getPassPercentageAndColor(passed, total) {
  const passPercentage = (passed / total) * 100;
  let color;
  if (passPercentage === 100) color = 'green';
  else if (passPercentage >= 90) color = 'yellow';
  else color = 'red';
  return { passPercentage: passPercentage.toFixed(2), color };
}

const jsonData = JSON.parse(fs.readFileSync('data.json', 'utf8'));

const appsData = [];
for (const app in jsonData.apps.salesforce) {
  const result = jsonData.apps.salesforce[app];
  const { passPercentage, color } = getPassPercentageAndColor(result.passed, result.total);
  appsData.push({
    app,
    total: result.total,
    passed: result.passed,
    failed: result.failed,
    passPercentage: parseFloat(passPercentage),
    color
  });
}

// Sort by total for larger blocks first
appsData.sort((a, b) => b.total - a.total);

// Verbal Table
let verbalTable = `
<h3>Verbal Table</h3>
<table>
  <tr>
    <th>Application</th>
    <th>Total</th>
    <th>Passed</th>
    <th>Failed</th>
    <th>Pass %</th>
  </tr>
`;
appsData.forEach(d => {
  verbalTable += `
  <tr>
    <td style="background-color:${d.color};">${d.app}</td>
    <td>${d.total}</td>
    <td>${d.passed}</td>
    <td>${d.failed}</td>
    <td>${d.passPercentage}%</td>
  </tr>`;
});
verbalTable += "</table>";

// Treemap Grid (10x10 units)
const gridSize = 10;
const totalUnits = gridSize * gridSize;
const totalTests = appsData.reduce((sum, d) => sum + d.total, 0);

// allocate blocks
appsData.forEach(d => {
  d.units = Math.max(1, Math.round((d.total / totalTests) * totalUnits));
});

// Flatten grid with labels
let grid = [];
appsData.forEach(d => {
  for (let i = 0; i < d.units; i++) {
    grid.push(d);
  }
});

// Fill grid into 10x10
let treemapTable = `
<h3>Treemap Approximation</h3>
<table style="border-collapse: collapse; width: 100%; text-align:center;">
`;
for (let row = 0; row < gridSize; row++) {
  treemapTable += "<tr>";
  for (let col = 0; col < gridSize; col++) {
    const index = row * gridSize + col;
    const d = grid[index];
    if (!d) {
      treemapTable += `<td style="border:1px solid #ccc;"></td>`;
    } else {
      treemapTable += `<td style="background-color:${d.color}; border:1px solid #000;">${d.app}</td>`;
    }
  }
  treemapTable += "</tr>\n";
}
treemapTable += "</table>";

// Combine content
const pageContent = `
<h2>Automation Test Results</h2>
${verbalTable}
${treemapTable}
`;

const payload = {
  "title": "Treemap and Table Representation",
  "type": "page",
  "space": { "key": "YOUR_SPACE_KEY" },
  "body": {
    "storage": {
      "value": pageContent,
      "representation": "storage"
    }
  }
};

fs.writeFileSync('payload.json', JSON.stringify(payload, null, 2));
console.log("✅ Payload with grid-style treemap generated!");
