const path = require('path');
const fs = require('fs');
const papaparse = require('papaparse');
const ui_core = require('./ui_core');

/**
 * @param {Object[]} data
 * @param {string} file_name
 */
function save_csv(data, file_name) {
    const csv_str = papaparse.unparse(data);
    const file_path = path.join('etc', file_name.toLowerCase());
    fs.writeFile(file_path, csv_str, () => {
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'INFO',
                msg: `Wrote CSV Data to File: ${file_path}`,
            },
        });
    });
}

module.exports = { save_csv };
