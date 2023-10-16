const fs = require('fs');
const papaparse = require('papaparse');

/**
 * @param {Object[]} data
 */
function save_csv(data) {
    const csv_str = papaparse.unparse(data);
    const file_path = './data.csv';
    debugger;
    fs.writeFile(file_path, csv_str, () => { console.log(`csv.save_csv [INFO] output file [${file_path}]`); });
}

module.exports = { save_csv };
