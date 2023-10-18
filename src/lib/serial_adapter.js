const { SerialPort, DelimiterParser } = require('serialport');
const { decode_packet, encode_packet } = require('./serial_driver');
const ui_core = require('./ui_core');
const { save_csv } = require('./csv');

const MODULE_ID = 'lib.serial_adapter';
const PROTOCOL_VERSION = 0x87;

/** @type {string} */
let sp_name = null;
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
    const func_id = `${MODULE_ID}.send_command`;
    if (sp === null) {
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: func_id,
                level: 'ERROR',
                msg: `Serial Port [${sp_name}] is not Connected`,
            },
        });
        return;
    }

    const result = encode_packet(PROTOCOL_VERSION, seq_number, msg_type, args);
    if (result.err) {
        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: func_id,
                level: 'ERROR',
                msg: JSON.stringify(result.err),
            },
        });
        return;
    }

    const device_cmd_packet = result.ok;
    ui_core.trigger_ui_event('add_sys_log', {
        log_msg: {
            module_id: func_id,
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
                    module_id: func_id,
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
 * @param {Function} on_packet
 */
function init_serial_adapter(sp_name, baud_rate) {
    const func_id = `${MODULE_ID}.init_serial_adapter`;
    ui_core.trigger_ui_event('add_sys_log', {
        log_msg: {
            module_id: func_id,
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
                module_id: func_id,
                level: 'ERROR',
                msg: `Could not Connect to Device Serial Port, ${err.message}`,
            },
        });
        ui_core.trigger_ui_event('device_disconnected', {});
    });

    sp.on('open', () => {
        sp_name = sp_name;
        const parser = new DelimiterParser({ delimiter: Buffer.from([0x0D, 0x0A]), includeDelimiter: true });
        sp.pipe(parser);
        parser.on('data', on_serial_data_handler);

        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: func_id,
                level: 'INFO',
                msg: 'Connected to Device Serial Port',
            },
        });
        ui_core.trigger_ui_event('device_connected', {});
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
