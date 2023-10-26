const { SerialPort, DelimiterParser } = require('serialport');
const { decode_packet, encode_packet } = require('./serial_driver');
const ui_core = require('./ui_core');
const { save_csv } = require('./csv');

const MODULE_ID = 'lib.serial_adapter';
const PROTOCOL_VERSION = 0x87;

/** @type {string} */
/** @type {SerialPort} */
let sp = null;
/** @type {import('./serial_driver').DeviceMsg[]} */
let data_cache = [];
let seq_number = 0;

/**
 * @param {number} msg_type
 * @param {number} args
 */
function send_command(msg_type, args) {
    if (sp === null) {
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'ERROR',
                msg: 'Serial Port is not Connected',
            },
        });
        return;
    }

    const result = encode_packet(PROTOCOL_VERSION, seq_number, msg_type, args);
    if (result.err) {
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'ERROR',
                msg: JSON.stringify(result.err),
            },
        });
        return;
    }

    const device_cmd_packet = result.ok;
    ui_core.trigger_ui_event('add_sys_log', {
        log_msg: {
            module_id: '',
            level: 'INFO',
            msg: `Writing: ${device_cmd_packet}`,
        },
    });
    sp.write(device_cmd_packet);
    seq_number++;
}

/**
 * @param {Buffer} data
 */
function on_serial_data_handler(data) {
    const func_id = `${MODULE_ID}.on_serial_data_handler`;

    if (data[0] === PROTOCOL_VERSION && data[1] === PROTOCOL_VERSION) {
        const packet = new Uint8Array(data);
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: func_id,
                level: 'DEBUG',
                msg: `echo length: ${packet.length}, packet: ${packet}`,
            },
        });

        const result = decode_packet(packet);
        if (result.err) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: JSON.stringify(result.err),
                },
            });
            return;
        }

        /** @type {import('./serial_driver').DeviceMsg} */
        const device_msg = result.ok;
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: func_id,
                level: 'DEBUG',
                msg: JSON.stringify({
                    msg_type: device_msg.msg_type_str,
                    msg_value: device_msg.msg_value.toFixed(3),
                }),
            },
        });
        ui_core.trigger_ui_event('device_msg', { device_msg });
        data_cache.push(device_msg);
    }
}

/**
 * @param {string} sp_name
 * @param {number} baud_rate
 */
function connect_to_serial_port(sp_name, baud_rate) {
    ui_core.trigger_ui_event('add_sys_log', {
        log_msg: {
            module_id: '',
            level: 'INFO',
            msg: `Connecting to Port: ${sp_name}, Baud Rate: ${baud_rate}`,
        },
    });

    sp = new SerialPort({
        path: sp_name,
        baudRate: baud_rate,
        autoOpen: false,
    });

    sp.open(err => {
        if (!err)
            return;

        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'ERROR',
                msg: `Could not Connect to Device Serial Port, ${err.message}`,
            },
        });
        ui_core.trigger_ui_event('device_disconnected', {});
    });

    sp.on('open', () => {
        const parser = new DelimiterParser({ delimiter: Buffer.from([0x0D, 0x0A]), includeDelimiter: true });
        sp.pipe(parser);
        parser.on('data', on_serial_data_handler);

        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'INFO',
                msg: 'Connected to Device Serial Port',
            },
        });
        ui_core.trigger_ui_event('device_connected', { sp_name });
    });

    sp.on('close', () => {
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'ERROR',
                msg: 'Device Disconnected',
            },
        });
        disconnect_from_serial_port();
    });
}

function disconnect_from_serial_port() {
    if (sp) {
        if (!sp.closed) { sp.close(() => { }); }
        sp = null;
        ui_core.trigger_ui_event('device_disconnected', {});
    } else {
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'ERROR',
                msg: 'No Connected Device',
            },
        });
    }
}

/**
 * @param {number} baud_rate
 * @param {Function} on_packet
 */
function init_serial_adapter(baud_rate) {
    ui_core.add_ui_event('serial_port_connect', 'connect_to_serial_port', args => connect_to_serial_port(args.port_name, baud_rate));
    ui_core.add_ui_event('serial_port_disconnect', 'disconnect_from_serial_port', _ => disconnect_from_serial_port());

    SerialPort.list().then(ports => {
        const devices_ports = ports.filter(x => (x.path.includes('COM') || x.path.includes('ttyUSB') || x.path.includes('ttyACM')));

        if (devices_ports.length === 0) {
            ui_core.trigger_ui_event('add_sys_log', {
                log_msg: {
                    module_id: '',
                    level: 'ERROR',
                    msg: 'No Devices Detected',
                },
            });
            ui_core.trigger_ui_event('device_disconnected', {});
            return;
        }

        if (devices_ports.length === 1) {
            connect_to_serial_port(devices_ports[0].path, baud_rate);
            return;
        }

        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'INFO',
                msg: `Detected Multiple Ports: ${devices_ports.map(x => x.path).join(', ')}`,
            },
        });

        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'INFO',
                msg: 'Choose One by Typing CONNECT or CN <port_name>',
            },
        });
    }).catch(err => {
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'ERROR',
                msg: `Can not Scan Devices, Error: ${err}`,
            },
        });
    });

    ui_core.add_ui_event('write_data', 'write_data_func', (args) => {
        const { file_name } = args;
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'INFO',
                msg: 'Writing Device Data',
            },
        });
        save_csv(data_cache, file_name);
    });
}

module.exports = { init_serial_adapter, send_command };
