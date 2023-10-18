const blessed = require('blessed');
const ui_core = require('../../lib/ui_core');
const { MsgTypes } = require('../../lib/serial_driver');
const { send_command } = require('../../lib/serial_adapter');

const top_level_cmds = {
    'RESET': (_) => {
        send_command(MsgTypes.WRITE_RESET_SCALE, 0xFF);
    },
    'SET': (/** @type {string[]} */ cmd_parts) => {
        const set_target = cmd_parts[1];
        if (!set_target) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: 'No Set Target was Given',
                },
            });
            return;
        }

        const CMD_TARGETS = {
            'PISP': MsgTypes.WRITE_PISTON_PUMP,
            'PERP': MsgTypes.WRITE_PERISTALTIC_PUMP,
        };
        if (!(Object.keys(CMD_TARGETS)).includes(set_target)) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: `Unknown SET Target: ${set_target}`,
                },
            });
            return;
        }

        const set_value = cmd_parts[2];
        if (!set_value) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: 'No Set Value was Given',
                },
            });
            return;
        }

        send_command(CMD_TARGETS[set_target], set_value);
    },
    'WRITE': (/** @type {string[]} */ cmd_parts) => {
        const data_source = cmd_parts[1];
        if (!data_source) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: 'No Data Source was Given',
                },
            });
            return;
        }

        const CMD_EVENT_MAP = {
            'DATA': 'write_data',
            'LOG': 'write_log',
        };
        if (!(Object.keys(CMD_EVENT_MAP)).includes(data_source)) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: `Unknown Data Source: ${data_source}`,
                },
            });
            return;
        }

        const file_name = cmd_parts[2];
        if (!file_name) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: 'No File Name was Given',
                },
            });
            return;
        }

        ui_core.trigger_ui_event(CMD_EVENT_MAP[data_source], { file_name });
    },
    'PLOT': (/** @type {string[]} */ cmd_parts) => {
        const plot_param = cmd_parts[1];
        if (!plot_param) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: 'No Plot Parameter was Given',
                },
            });
            return;
        }

        const PARAM_MSG_TYPE_MAP = {
            'TEMP': MsgTypes.READ_TEMPERATURE,
            'WGHT': MsgTypes.READ_WEIGHT,
            'PRES': MsgTypes.READ_PRESSURE,
        };

        if (!(Object.keys(PARAM_MSG_TYPE_MAP)).includes(plot_param)) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: `Unknown Plot Param: ${plot_param}`,
                },
            });
            return;
        }

        ui_core.trigger_ui_event('change_plot_param', { msg_type: PARAM_MSG_TYPE_MAP[plot_param] });
    },
    'EXIT': (_) => { process.exit(0); },
};

/**
 * @param {string} cmd 
 */
function exec_cmd(cmd) {
    const cmd_parts = cmd.split(' ');
    const top_level_cmd = cmd_parts[0];
    if (!(Object.keys(top_level_cmds).includes(top_level_cmd))) {
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'ERROR',
                msg: `Unknown Command: ${cmd}`,
            },
        });
        return;
    }
    top_level_cmds[cmd_parts[0]](cmd_parts);
}

function render() {
    /** @type {blessed.Widgets.BoxElement} */
    const dc_comp = ui_core.main_grid.set(9, 0, 1, 1, blessed.box, {
        content: 'CONNECTING...',
        style: {
            fg: 'yellow',
            bold: true,
        },
        align: 'center',
        valign: 'middle',
    });

    /** @type {blessed.Widgets.TextboxElement} */
    const cmd_prompt_comp = ui_core.main_grid.set(9, 1, 1, 4, blessed.textbox, {
        label: 'COMMAND_PROMPT',
        keys: true,
        mouse: true,
        inputOnFocus: true,
    });
    cmd_prompt_comp.focus();

    cmd_prompt_comp.on('submit', (/** @type {String} */ data) => {
        cmd_prompt_comp.clearValue();
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'INFO',
                msg: `Executing: ${data}`,
            },
        });
        exec_cmd(data.toUpperCase());
        cmd_prompt_comp.focus();
    });

    ui_core.add_ui_event('device_disconnected', 'device_disconnected_func', _ => {
        dc_comp.setContent('DISCONNECTED');
        dc_comp.style.fg = 'red';
    });

    ui_core.add_ui_event('device_connected', 'device_disconnected_func', _ => {
        dc_comp.setContent('CONNECTED');
        dc_comp.style.fg = 'green';
    });
}

module.exports = { render };
