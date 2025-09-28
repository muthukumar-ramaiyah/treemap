const fs = require('fs');
const path = require('path');
const { argv } = require('process');

let appName = argv[2]

// Read JSON file
const jsonData = JSON.parse(fs.readFileSync('data.json', 'utf8'));


// Function to calculate pass percentage and determine class
function getPassPercentageAndClass(passed, total, skipped) {
    const passPercentage = (passed / (total - skipped)) * 100;
    let className;
    let color;
    if (passPercentage === 100) {
        className = 'passed-100';
    } else if (passPercentage >= 90 && passPercentage < 100) {
        className = 'passed-90-99';
    } else {
        className = 'passed-below-90';
    }
    color = jsonData.legend[className];
    return { passPercentage: passPercentage.toFixed(2), className, color };
}

// Prepare table data and treemap data
const tableData = [];
const treemapData = [];
for (const api in jsonData.apps[appName]) {
    const result = jsonData.apps[appName][api];
    const { passPercentage, className, color } = getPassPercentageAndClass(result.passed, result.total, result.skipped);
    tableData.push({
        api,
        total: result.total,
        passed: result.passed,
        failed: result.failed,
        passPercentage,
        className
    });
    treemapData.push({
        id: api,
        name: `${jsonData.mappings.apps[appName][api]['api_name']} (${passPercentage}%)`,        
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
    <!-- <script src="https://code.highcharts.com/highcharts.js"></script> -- IGNORE - -->
    <script src="./modules/highcharts.js"></script>
    <!-- <script src="https://code.highcharts.com/modules/treemap.js"></script> -- IGNORE - -->
    <script src="./modules/treemap.js"></script>
    <script src="https://unpkg.com/tabulator-tables@5.5.2/dist/js/tabulator.min.js"></script>
    <style>
        .passed-100 {
            background-color: #99ffbb;
            color: white;
        }
        .passed-90-99 {
            background-color: #ffff80;
        }
        .passed-below-90 {
            background-color: #ff9999;
            color: white;
        }
    .highcharts-point {
        rx: 10;
        ry: 10;
    }

    </style>
</head>
<body>
<div id="treemap-area" style="width: 600px; margin: auto; text-align: center;">
    <!-- Treemap container -->
    <div id="treemap-container" style="width: 600px; height: 400px; margin: auto;"></div>
    <!-- Custom legend -->
    <div id="legends" style="margin-top: 12px; font-family: Arial, sans-serif;">
        <span style="background-color: ${jsonData.legend['passed-100']}; color: white; padding: 4px 10px; border-radius: 4px; margin: 0 6px;">
            100%
        </span>
        <span style="background-color: ${jsonData.legend['passed-90-99']}; color: black; padding: 4px 10px; border-radius: 4px; margin: 0 6px;">
            90–99%
        </span>
        <span style="background-color: ${jsonData.legend['passed-below-90']}; color: white; padding: 4px 10px; border-radius: 4px; margin: 0 6px;">
            Below 90%
        </span>
    </div>
    <br />
</div>
    <div id="table-container"></div>
    <script>
        // const tableData = ${JSON.stringify(tableData)};
        const treemapData = ${JSON.stringify(treemapData)};

        // Create table
        // const table = new Tabulator("#table-container", {
        //     data: tableData,
        //     layout: "fitColumns",
        //     columns: [
        //         { title: "App", field: "app" },
        //         { title: "Total", field: "total" },
        //         { title: "Passed", field: "passed" },
        //         { title: "Failed", field: "failed" },
        //         {
        //             title: "Pass Percentage",
        //             field: "passPercentage",
        //             formatter: function(cell, formatterParams, onRendered) {
        //                 const className = cell.getRow().getData().className;
        //                 return \`<span class="\${className}">\${cell.getValue()}</span>\`;
        //             }
        //         },
        //     ],
        // });

        // Create treemap
        Highcharts.chart('treemap-container', {
            series: [{
                type: 'treemap',
                layoutAlgorithm: 'squarified',
                borderRadius: 10,   // ✅ Add rounded corners here
                borderWidth: 5,
                data: treemapData
            }],
            title: {
                text: 'Pass Percentage'
            }
        });
    </script>
</body>
</html>
`;

// Write HTML to file
fs.writeFileSync('output.html', html);
console.log('HTML file generated successfully!');
