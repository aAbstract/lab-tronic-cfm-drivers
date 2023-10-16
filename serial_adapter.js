const { SerialPort, DelimiterParser } = require('serialport');
const { decode_packet } = require('./serial_driver');

/** @type {string} */
let sp_name = null;
/** @type {SerialPort} */
let sp = null;

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
function init_serial_adapter(sp_name, baud_rate, on_packet) {
    const PROTOCOL_VERSION = 0x87;
    sp = new SerialPort({
        path: sp_name,
        baudRate: baud_rate,
    });
    sp_name = sp_name;
    const parser = new DelimiterParser({ delimiter: Buffer.from([0x0A]), includeDelimiter: true });
    sp.pipe(parser);

    parser.on('data', (/** @type {Buffer} */ data) => {
        if (data[0] === PROTOCOL_VERSION && data[1] === PROTOCOL_VERSION) {
            const packet = new Uint8Array(data);
            console.log(`serial_adapter.init_serial_adapter [DEBUG] echo length: ${packet.length}, packet: ${packet}`);
            const result = decode_packet(packet);
            if (result.err) {
                console.log(result);
                return;
            }
            on_packet(result.ok);
        }
    });
}

module.exports = { init_serial_adapter, send_reset_scale };
