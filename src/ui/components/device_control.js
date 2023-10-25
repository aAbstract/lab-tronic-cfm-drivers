const blessed = require('blessed');
const ui_core = require('../../lib/ui_core');
const { MsgTypes } = require('../../lib/serial_driver');
const { send_command } = require('../../lib/serial_adapter');

const START_ROW = 10;
const START_COL = 11;
const F_HEIGHT = 2;
const F_WIDTH = 9;

let control_var = null;

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
    // ui layout
    /** @type {blessed.Widgets.BoxElement} */
    const device_state_comp = ui_core.main_grid.set(START_ROW, START_COL, F_HEIGHT, F_WIDTH, blessed.box, {
        content: 'DEVICE: CONNECTING...',
        style: {
            fg: 'yellow',
            bold: true,
        },
        align: 'center',
        valign: 'middle',
    });

    /** @type {blessed.Widgets.ButtonElement} */
    const control_pist_btn = ui_core.main_grid.set(START_ROW + F_HEIGHT, START_COL, F_HEIGHT, F_WIDTH / 3, blessed.button, {
        content: 'CONTROL PISTON PUMP',
        mouse: true,
        style: {
            fg: 'yellow',
            bold: true,
            hover: {
                bg: 'yellow',
                fg: 'white',
            },
        },
        align: 'center',
        valign: 'middle',
    });

    /** @type {blessed.Widgets.ButtonElement} */
    const control_perp_btn = ui_core.main_grid.set(START_ROW + F_HEIGHT, START_COL + (F_WIDTH / 3), F_HEIGHT, F_WIDTH / 3, blessed.button, {
        content: 'CONTROL PERISTALTIC PUMP',
        mouse: true,
        style: {
            fg: 'magenta',
            bold: true,
            hover: {
                bg: 'magenta',
                fg: 'white',
            },
        },
        align: 'center',
        valign: 'middle',
    });

    /** @type {blessed.Widgets.ButtonElement} */
    const reset_scale_btn = ui_core.main_grid.set(START_ROW + F_HEIGHT, START_COL + 2 * (F_WIDTH / 3), F_HEIGHT, F_WIDTH / 3, blessed.button, {
        content: 'RESET SCALE',
        mouse: true,
        style: {
            fg: 'green',
            bold: true,
            hover: {
                bg: 'green',
                fg: 'white',
            },
        },
        align: 'center',
        valign: 'middle',
    });

    /** @type {blessed.Widgets.TextboxElement} */
    const cmd_prompt_comp = ui_core.main_grid.set(START_ROW + 2 * F_HEIGHT, START_COL, F_HEIGHT, F_WIDTH, blessed.textbox, {
        label: 'COMMAND_PROMPT',
        keys: true,
        mouse: true,
        inputOnFocus: true,
    });

    /** @type {blessed.Widgets.ButtonElement} */
    const exit_btn = ui_core.main_grid.set(START_ROW + 3 * F_HEIGHT, START_COL + (F_WIDTH / 3), F_HEIGHT, F_WIDTH / 3, blessed.button, {
        content: 'EXIT',
        mouse: true,
        style: {
            fg: 'red',
            bold: true,
            hover: {
                bg: 'red',
                fg: 'white',
            },
        },
        align: 'center',
        valign: 'middle',
    });

    // event handlers
    cmd_prompt_comp.on('submit', (/** @type {String} */ data) => {
        cmd_prompt_comp.clearValue();
        if (control_var) {
            if (control_var === 'PISP') {
                const control_val = Number(data);
                if (isNaN(control_val)) {
                    ui_core.trigger_ui_event('add_sys_log', {
                        log_msg: {
                            module_id: '',
                            level: 'ERROR',
                            msg: `Invalid Control Value: ${data}, RPM Should be a Positive Integer`,
                        },
                    });
                    return;
                }
                const cmd = `SET ${control_var} ${control_val}`;
                exec_cmd(cmd);
            }
            else if (control_var === 'PERP') {
                const control_val = Number(data);
                if (isNaN(control_val) || !([0, 1, 2, 3].includes(control_val))) {
                    ui_core.trigger_ui_event('add_sys_log', {
                        log_msg: {
                            module_id: '',
                            level: 'ERROR',
                            msg: `Invalid Control Value: ${data}, Choose One From (0,1,2,3)`,
                        },
                    });
                    return;
                }
                const cmd = `SET ${control_var} ${control_val}`;
                exec_cmd(cmd);
            } else {
                ui_core.trigger_ui_event('add_sys_log', {
                    log_msg: {
                        module_id: '',
                        level: 'ERROR',
                        msg: `Invalid Control Variable: ${control_var}`,
                    },
                });
                return;
            }
        } else {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'INFO',
                    msg: `Executing: ${data}`,
                },
            });
            exec_cmd(data.toUpperCase());
        }
        control_var = null;
        cmd_prompt_comp.setLabel('COMMAND_PROMPT');
        ui_core.screen.render();
    });

    exit_btn.on('press', () => { exec_cmd('EXIT'); });

    control_pist_btn.on('press', () => {
        cmd_prompt_comp.clearValue();
        cmd_prompt_comp.setLabel('Enter Piston Pump RPM: ');
        control_var = 'PISP';
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'INFO',
                msg: 'Control Variable Set to PISTON_PUMP',
            },
        });
    });

    control_perp_btn.on('press', () => {
        cmd_prompt_comp.clearValue();
        cmd_prompt_comp.setLabel('Enter Peristaltic Pump Speed (0->STOP,1->LOW,2->MEDIUM,3->HIGH): ');
        control_var = 'PERP';
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'INFO',
                msg: 'Control Variable Set to PERISTALTIC_PUMP',
            },
        });
    });

    reset_scale_btn.on('press', () => { exec_cmd('RESET'); });

    ui_core.add_ui_event('device_disconnected', 'device_disconnected_func', _ => {
        device_state_comp.setContent('DEVICE: DISCONNECTED');
        device_state_comp.style.fg = 'red';
    });

    ui_core.add_ui_event('device_connected', 'device_disconnected_func', _ => {
        device_state_comp.setContent('DEVICE: CONNECTED');
        device_state_comp.style.fg = 'green';
    });
}

module.exports = { render };
