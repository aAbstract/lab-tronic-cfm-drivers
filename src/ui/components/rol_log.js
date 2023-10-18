/**
 * @typedef {Object} LogMsg
 * @property {string} datetime
 * @property {string} module_id
 * @property {string} level
 * @property {string} msg
 */

const blessed_contrib = require('blessed-contrib');
const ui_core = require('../../lib/ui_core');
const moment = require('moment');
const { save_csv } = require('../../lib/csv');

const FG_RED = '\x1b[31m';
const FG_GREEN = '\x1b[32m';
const FG_YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const LEVEL_COLOR_MAP = {
    'INFO': FG_GREEN,
    'DEBUG': FG_YELLOW,
    'ERROR': FG_RED,
};
const ALLOWED_LEVELS = ['INFO', 'DEBUGx', 'ERROR'];

/** @type {LogMsg[]} */
const log_cache = [];

function render() {
    const rol_log_comp = ui_core.main_grid.set(7, 0, 2, 5, blessed_contrib.log, {
        fg: 'white',
        label: 'SYSTEM_LOGS',
    });

    ui_core.add_ui_event('add_sys_log', 'add_sys_log_func', (args) => {
        /** @type {LogMsg} */
        let log_msg = args.log_msg;
        log_msg.datetime = moment().format().split('+')[0];
        log_cache.push(log_msg);

        if (ALLOWED_LEVELS.includes(log_msg.level)) {
            const log_level_tag = `${LEVEL_COLOR_MAP[log_msg.level]}${log_msg.level}${RESET}`;
            if (log_msg.level === 'DEBUG')
                rol_log_comp.log(`[${log_msg.datetime}] [${log_level_tag}] [${log_msg.module_id}] | ${log_msg.msg}`);
            else
                rol_log_comp.log(`[${log_msg.datetime}] [${log_level_tag}] | ${log_msg.msg}`);
        }
    });

    ui_core.add_ui_event('write_log', 'write_log_func', (args) => {
        const { file_name } = args;
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'INFO',
                msg: 'Writing System Logs',
            },
        });
        save_csv(log_cache, file_name);
    });
}

module.exports = { render };
