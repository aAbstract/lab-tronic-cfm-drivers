const { SerialPort, DelimiterParser } = require('serialport');
const { decode_packet } = require('./serial_driver');
const ui_core = require('./ui_core');

const MODULE_ID = 'lib.serial_adapter';

/** @type {string} */
let sp_name = null;
/** @type {SerialPort} */
let sp = null;
/** @type {import('./serial_driver').DeviceMsg[]} */
let data_cache = [];

/**
 * @returns {import('./serial_driver').Result}
 */
function send_reset_scale() {
    if (sp === null)
        return { err: `Serial Port [${sp_name}] is not Connected` };
    const packet = Buffer.from([0x87, 0x87, 0x0B, 0xFF, 0xFF, 0xCF, 0x00, 0xA9, 0xD9, 0x0D, 0x0A]);
    console.log(`Writing: ${new Uint8Array(packet)}`);
    sp.write(packet);
    return { ok: 'OK' };
}

/**
 * @param {string} sp_name
 * @param {number} baud_rate
 * @param {Function} on_packet
 */
function init_serial_adapter(sp_name, baud_rate) {
    const PROTOCOL_VERSION = 0x87;
    sp = new SerialPort({
        path: sp_name,
        baudRate: baud_rate,
    });
    sp_name = sp_name;
    const parser = new DelimiterParser({ delimiter: Buffer.from([0x0D, 0x0A]), includeDelimiter: true });
    sp.pipe(parser);

    parser.on('data', (/** @type {Buffer} */ data) => {
        const func_id = `${MODULE_ID}.on_data`;

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
    });
}

module.exports = { init_serial_adapter, send_reset_scale };
