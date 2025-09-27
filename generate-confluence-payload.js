const fs = require('fs');
const path = require('path');

// Function to calculate pass percentage and determine class
function getPassPercentageAndClass(passed, total) {
    const passPercentage = (passed / total) * 100;
    let className;
    let color;
    if (passPercentage === 100) {
        className = 'passed-100';
        color = 'green';
    } else if (passPercentage >= 90 && passPercentage < 100) {
        className = 'passed-90-99';
        color = 'yellow';
    } else {
        className = 'passed-below-90';
        color = 'red';
    }
    return { passPercentage: passPercentage.toFixed(2), className, color };
}

// Read JSON file
const jsonData = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Prepare table data and treemap data
const tableData = [];
const treemapData = [];
for (const app in jsonData.apps.salesforce) {
    const result = jsonData.apps.salesforce[app];
    const { passPercentage, className, color } = getPassPercentageAndClass(result.passed, result.total);
    tableData.push({
        app,
        total: result.total,
        passed: result.passed,
        failed: result.failed,
        passPercentage,
        className
    });
    treemapData.push({
        id: app,
        name: app,
        value: parseFloat(passPercentage),
        color
    });
}

// Generate HTML
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Treemap and Table Representation</title>
    <link rel="stylesheet" href="https://unpkg.com/tabulator-tables@5.5.2/dist/css/tabulator.min.css">
    <script src="https://code.highcharts.com/highcharts.js"></script>
    <script src="https://code.highcharts.com/modules/treemap.js"></script>
    <script src="https://unpkg.com/tabulator-tables@5.5.2/dist/js/tabulator.min.js"></script>
    <style>
        .passed-100 {
            background-color: green;
            color: white;
        }
        .passed-90-99 {
            background-color: yellow;
        }
        .passed-below-90 {
            background-color: red;
            color: white;
        }
    </style>
</head>
<body>
    <div id="treemap-container" style="width: 600px; height: 400px;"></div>
    <div id="table-container"></div>

    <script>
        const tableData = ${JSON.stringify(tableData)};
        const treemapData = ${JSON.stringify(treemapData)};

        // Create table
        const table = new Tabulator("#table-container", {
            data: tableData,
            layout: "fitColumns",
            columns: [
                { title: "App", field: "app" },
                { title: "Total", field: "total" },
                { title: "Passed", field: "passed" },
                { title: "Failed", field: "failed" },
                {
                    title: "Pass Percentage",
                    field: "passPercentage",
                    formatter: function(cell, formatterParams, onRendered) {
                        const className = cell.getRow().getData().className;
                        return \`<span class="\${className}">\${cell.getValue()}</span>\`;
                    }
                },
            ],
        });

        // Create treemap
        Highcharts.chart('treemap-container', {
            series: [{
                type: 'treemap',
                layoutAlgorithm: 'squarified',
                data: treemapData
            }],
            title: {
                text: 'Pass Percentage Treemap'
            }
        });
    </script>
</body>
</html>
`;

// Construct payload for Confluence API
const payload = {
    "title": "Treemap and Table Representation",
    "type": "page",
    "space": {
        "key": "YOUR_SPACE_KEY"
    },
    "body": {
        "storage": {
            "value": `
                <h1>Treemap and Table Representation</h1>
                <div>
                    <img src="data:image/png;base64,${Buffer.from(html).toString('base64')}" />
                </div>
            `,
            "representation": "storage"
        }
    }
};

// Alternatively, you can use iframe macro to embed the HTML
// const payload = {
//     "title": "Treemap and Table Representation",
//     "type": "page",
//     "space": {
//         "key": "YOUR_SPACE_KEY"
//     },
//     "body": {
//         "storage": {
//             "value": `
//                 <h1>Treemap and Table Representation</h1>
//                 <ac:macro ac:name="iframe">
//                     <ac:parameter ac:name="src">data:text/html,${encodeURIComponent(html)}</ac:parameter>
//                     <ac:parameter ac:name="width">100%</ac:parameter>
//                     <ac:parameter ac:name="height">500</ac:parameter>
//                 </ac:macro>
//             `,
//             "representation": "storage"
//         }
//     }
// };

console.log(payload);

// Write payload to file
fs.writeFileSync('payload.json', JSON.stringify(payload, null, 2));
console.log('Payload file generated successfully!');