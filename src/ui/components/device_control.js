const blessed = require('blessed');
const ui_core = require('../../lib/ui_core');
const { MsgTypes } = require('../../lib/serial_driver');
const { send_command, DEVICE_ERRORS } = require('../../lib/serial_adapter');

const START_ROW = 10;
const START_COL = 11;
const F_HEIGHT = 2;
const F_WIDTH = 9;

let control_var = null;
let alarm = false;
let last_sp_name = null;
setInterval(() => {
    if (alarm) { process.stderr.write('\x07') }
}, 1000);

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

        if (!cmd_parts[2]) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: 'No Set Value was Given',
                },
            });
            return;
        }

        let set_value = Number(cmd_parts[2]);
        if (isNaN(set_value)) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: `Invalid Control Value: ${cmd_parts[2]}`,
                },
            });
            return;
        }

        if (set_target === 'PISP' && set_value > 200) {
            set_value = 200;
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'INFO',
                    msg: `Adjusted Control Value to: ${set_value}`,
                },
            });
        }
        else if (set_target === 'PERP' && set_value > 3) {
            set_value = 3;
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'INFO',
                    msg: `Adjusted Control Value to: ${set_value}`,
                },
            });
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

        if (!(['TEMP', 'WGHT', 'PRES'].includes(plot_param))) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: `Unknown Plot Param: ${plot_param}`,
                },
            });
            return;
        }

        ui_core.trigger_ui_event(`select_${plot_param}_kpi`, {});
    },
    'CONNECT': (/** @type {string[]} */ cmd_parts) => {
        const port_name = cmd_parts[1];
        if (!port_name) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: 'No Port Name was Given',
                },
            });
            return;
        }
        last_sp_name = port_name.replace('/DEV/TTY', '/dev/tty');
        ui_core.trigger_ui_event('serial_port_connect', { port_name: last_sp_name });
    },
    'DISCONNECT': (_) => { ui_core.trigger_ui_event('serial_port_disconnect', {}) },
    'RECOVER': () => { ui_core.trigger_ui_event('device_error_recover', {}) },
    'ALARM': () => { alarm = false },
    'EXIT': (_) => { process.exit(0); },
};

/**
 * @param {string} cmd 
 */
function exec_cmd(cmd) {
    const CMD_ALIASES = {
        'RS': 'RESET',
        'SI': 'SET PISP',
        'SE': 'SET PERP',
        'WD': 'WRITE DATA',
        'WL': 'WRITE LOG',
        'PT': 'PLOT TEMP',
        'PW': 'PLOT WGHT',
        'PP': 'PLOT PRES',
        'CN': 'CONNECT',
        'DC': 'DISCONNECT',
        'RV': 'RECOVER',
        'AL': 'ALARM',
        'EX': 'EXIT',
    };

    const first_part = cmd.split(' ')[0];
    let parsed_cmd = cmd;
    if (Object.keys(CMD_ALIASES).includes(first_part))
        parsed_cmd = cmd.replace(first_part, CMD_ALIASES[first_part]);

    ui_core.trigger_ui_event('add_sys_log', {
        log_msg: {
            module_id: '',
            level: 'INFO',
            msg: `Executing: ${parsed_cmd}`,
        },
    });

    cmd_parts = parsed_cmd.split(' ');
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
    const device_state_comp = ui_core.main_grid.set(START_ROW, START_COL, F_HEIGHT, 2 * (F_WIDTH / 3), blessed.box, {
        content: 'DEVICE: CONNECTING...',
        style: {
            fg: 'yellow',
            bold: true,
        },
        align: 'center',
        valign: 'middle',
    });

    /** @type {blessed.Widgets.BoxElement} */
    const device_health_comp = ui_core.main_grid.set(START_ROW, START_COL + 2 * (F_WIDTH / 3), F_HEIGHT, F_WIDTH / 3, blessed.box, {
        content: '--',
        style: {
            fg: 'yellow',
            bold: true,
        },
        align: 'center',
        valign: 'middle',
    });

    /** @type {blessed.Widgets.ButtonElement} */
    const control_pist_btn = ui_core.main_grid.set(START_ROW + F_HEIGHT, START_COL, F_HEIGHT, F_WIDTH / 3, blessed.button, {
        content: 'PISTON PUMP [SI]',
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
        content: 'PERISTALTIC PUMP [SE]',
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
        content: 'RESET SCALE [RS]',
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
        content: 'EXIT [EX]',
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
            exec_cmd(data.toUpperCase());
            cmd_prompt_comp.focus();
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
        device_state_comp.setContent('DEVICE: DISCONNECTED [CN, DC]');
        device_state_comp.style.fg = 'red';
        device_health_comp.setContent('--');
        device_health_comp.style.fg = 'yellow';
    });

    ui_core.add_ui_event('device_connected', 'device_disconnected_func', args => {
        device_state_comp.setContent(`DEVICE-${args.sp_name} CONNECTED [CN, DC]`);
        device_state_comp.style.fg = 'green';
        device_health_comp.setContent('HEALTHY');
        device_health_comp.style.fg = 'green';
    });

    ui_core.add_ui_event('device_error', 'device_error_func', args => {
        /** @type {import('../../lib/serial_driver').DeviceMsg} */
        const device_msg = args.device_msg;
        const device_err_hex = device_msg.msg_value.toString(16).toUpperCase().padStart(2, '0');
        device_health_comp.setContent(`DEVICE_ERROR: ${device_err_hex} [RV]`);
        device_health_comp.style.fg = 'red';
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'ERROR',
                msg: `DEVICE_ERROR=${device_err_hex}, Msg="${DEVICE_ERRORS[device_msg.msg_value]}"`,
            },
        });
        alarm = true;
    });

    ui_core.add_ui_event('device_error_recover', 'device_error_recover_func', _ => {
        device_health_comp.setContent('--');
        device_health_comp.style.fg = 'yellow';
        alarm = false;

        if (!last_sp_name) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: 'Could not Get Last Port Name, Reconnect Using CN port_name',
                },
            });
            return;
        }

        ui_core.trigger_ui_event('serial_port_disconnect', {});
        ui_core.trigger_ui_event('serial_port_connect', { port_name: last_sp_name });
    });

    ui_core.add_ui_event('set_last_port_name', 'set_last_port_name_func', args => { last_sp_name = args.port_name });

    cmd_prompt_comp.focus();
}

module.exports = { render };
