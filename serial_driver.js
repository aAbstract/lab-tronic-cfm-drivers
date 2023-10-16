// <models>
/**
 * @typedef {Object} Result
 * @property {any} ok
 * @property {any} err
 */

/**
 * @typedef {Object} DeviceMsg
 * @property {number} protocol_version
 * @property {number} packet_length
 * @property {number} seq_number
 * @property {number} data_type
 * @property {string} data_type_str
 * @property {number} data_length
 * @property {number} msg_type
 * @property {string} msg_type_str
 * @property {string} cfg2
 * @property {string} b64_msg_buffer // base64 encoded binary msg value
 * @property {number} msg_value
 */
// </models>

// <defines>
const PACKET_MIN_LENGTH = 11; // 4(start, end) + length + 2(seq_number) + 2(cfg) + 2(crc)
const DATA_START = 7;

// CONF_BYTE_1[7,6] values map
const DataTypes = {
    INT: 0,
    UINT: 1,
    FLOAT: 2,
    COMMAND: 3,
};
const DataTypesStr = {
    0: 'INT',
    1: 'UINT',
    2: 'FLOAT',
    3: 'COMMAND',
};

// CONF_BYTE_1[3,2,1,0] values map
const MsgTypes = {
    READ_PISTON_PUMP: 0,
    READ_PERISTALTIC_PUMP: 1,
    READ_WEIGHT: 2,
    READ_TEMPERATURE: 3,
    READ_PRESSURE: 4,
    WRITE_PISTON_PUMP: 12,
    WRITE_PERISTALTIC_PUMP: 13,
    WRITE_RESET_SCALE: 15,
};
const MsgTypesConfig = {
    0: {
        name: 'READ_PISTON_PUMP',
        data_type: DataTypes.UINT,
        data_length: 4,
    },
    1: {
        name: 'READ_PERISTALTIC_PUMP',
        data_type: DataTypes.UINT,
        data_length: 1,
    },
    2: {
        name: 'READ_WEIGHT',
        data_type: DataTypes.FLOAT,
        data_length: 4,
    },
    3: {
        name: 'READ_TEMPERATURE',
        data_type: DataTypes.FLOAT,
        data_length: 4,
    },
    4: {
        name: 'READ_PRESSURE',
        data_type: DataTypes.FLOAT,
        data_length: 4,
    },
    12: {
        name: 'WRITE_PISTON_PUMP',
        data_type: DataTypes.INT,
        data_length: 4,
    },
    13: {
        name: 'WRITE_PERISTALTIC_PUMP',
        data_type: DataTypes.UINT,
        data_length: 1,
    },
    15: {
        name: 'WRITE_RESET_SCALE',
        data_type: DataTypes.COMMAND,
        data_length: 1,
    },
};

const CRC16_POLYNOMIAL = new Uint16Array([
    0x0000, 0x1189, 0x2312, 0x329B, 0x4624, 0x57AD, 0x6536, 0x74BF,
    0x8C48, 0x9DC1, 0xAF5A, 0xBED3, 0xCA6C, 0xDBE5, 0xE97E, 0xF8F7,
    0x1081, 0x0108, 0x3393, 0x221A, 0x56A5, 0x472C, 0x75B7, 0x643E,
    0x9CC9, 0x8D40, 0xBFDB, 0xAE52, 0xDAED, 0xCB64, 0xF9FF, 0xE876,
    0x2102, 0x308B, 0x0210, 0x1399, 0x6726, 0x76AF, 0x4434, 0x55BD,
    0xAD4A, 0xBCC3, 0x8E58, 0x9FD1, 0xEB6E, 0xFAE7, 0xC87C, 0xD9F5,
    0x3183, 0x200A, 0x1291, 0x0318, 0x77A7, 0x662E, 0x54B5, 0x453C,
    0xBDCB, 0xAC42, 0x9ED9, 0x8F50, 0xFBEF, 0xEA66, 0xD8FD, 0xC974,
    0x4204, 0x538D, 0x6116, 0x709F, 0x0420, 0x15A9, 0x2732, 0x36BB,
    0xCE4C, 0xDFC5, 0xED5E, 0xFCD7, 0x8868, 0x99E1, 0xAB7A, 0xBAF3,
    0x5285, 0x430C, 0x7197, 0x601E, 0x14A1, 0x0528, 0x37B3, 0x263A,
    0xDECD, 0xCF44, 0xFDDF, 0xEC56, 0x98E9, 0x8960, 0xBBFB, 0xAA72,
    0x6306, 0x728F, 0x4014, 0x519D, 0x2522, 0x34AB, 0x0630, 0x17B9,
    0xEF4E, 0xFEC7, 0xCC5C, 0xDDD5, 0xA96A, 0xB8E3, 0x8A78, 0x9BF1,
    0x7387, 0x620E, 0x5095, 0x411C, 0x35A3, 0x242A, 0x16B1, 0x0738,
    0xFFCF, 0xEE46, 0xDCDD, 0xCD54, 0xB9EB, 0xA862, 0x9AF9, 0x8B70,
    0x8408, 0x9581, 0xA71A, 0xB693, 0xC22C, 0xD3A5, 0xE13E, 0xF0B7,
    0x0840, 0x19C9, 0x2B52, 0x3ADB, 0x4E64, 0x5FED, 0x6D76, 0x7CFF,
    0x9489, 0x8500, 0xB79B, 0xA612, 0xD2AD, 0xC324, 0xF1BF, 0xE036,
    0x18C1, 0x0948, 0x3BD3, 0x2A5A, 0x5EE5, 0x4F6C, 0x7DF7, 0x6C7E,
    0xA50A, 0xB483, 0x8618, 0x9791, 0xE32E, 0xF2A7, 0xC03C, 0xD1B5,
    0x2942, 0x38CB, 0x0A50, 0x1BD9, 0x6F66, 0x7EEF, 0x4C74, 0x5DFD,
    0xB58B, 0xA402, 0x9699, 0x8710, 0xF3AF, 0xE226, 0xD0BD, 0xC134,
    0x39C3, 0x284A, 0x1AD1, 0x0B58, 0x7FE7, 0x6E6E, 0x5CF5, 0x4D7C,
    0xC60C, 0xD785, 0xE51E, 0xF497, 0x8028, 0x91A1, 0xA33A, 0xB2B3,
    0x4A44, 0x5BCD, 0x6956, 0x78DF, 0x0C60, 0x1DE9, 0x2F72, 0x3EFB,
    0xD68D, 0xC704, 0xF59F, 0xE416, 0x90A9, 0x8120, 0xB3BB, 0xA232,
    0x5AC5, 0x4B4C, 0x79D7, 0x685E, 0x1CE1, 0x0D68, 0x3FF3, 0x2E7A,
    0xE70E, 0xF687, 0xC41C, 0xD595, 0xA12A, 0xB0A3, 0x8238, 0x93B1,
    0x6B46, 0x7ACF, 0x4854, 0x59DD, 0x2D62, 0x3CEB, 0x0E70, 0x1FF9,
    0xF78F, 0xE606, 0xD49D, 0xC514, 0xB1AB, 0xA022, 0x92B9, 0x8330,
    0x7BC7, 0x6A4E, 0x58D5, 0x495C, 0x3DE3, 0x2C6A, 0x1EF1, 0x0F78,
]);

const PARSERS_MAP = {
    1: {
        [DataTypes.INT]: Int8Array,
        [DataTypes.UINT]: Uint8Array,
        [DataTypes.COMMAND]: Uint8Array,
    },
    2: {
        [DataTypes.INT]: Int16Array,
        [DataTypes.UINT]: Uint16Array,
    },
    4: {
        [DataTypes.INT]: Int32Array,
        [DataTypes.UINT]: Uint32Array,
        [DataTypes.FLOAT]: Float32Array,
    },
    8: {
        [DataTypes.INT]: BigInt64Array,
        [DataTypes.UINT]: BigUint64Array,
        [DataTypes.FLOAT]: Float64Array,
    },
};
// </defines>

// <utils>
/**
 * @param {number} byte
 * @returns {string}
 */
function bin_byte(byte) {
    const _bin_byte = byte.toString(2);
    const padded_bin_byte = _bin_byte.padStart(8, '0');
    return padded_bin_byte;
}

/**
 * @param {Uint8Array} byte
 * @returns {number}
 */
function compute_crc16(buffer) {
    let res = 0xffff;

    for (let b of buffer) {
        res = (res >> 8) ^ CRC16_POLYNOMIAL[(res ^ b) & 0xff];
    }

    return (~res) & 0xffff;
}

/**
 * @param {Uint8Array} buffer
 * @param {number} data_type
 * @returns {Result}
 */
function bin_parse(buffer, data_type) {
    if (data_type === DataTypes.FLOAT && (buffer.length === 1 || buffer.length === 2))
        return { err: `Can not Parse Buffer of Size [${buffer.length}] to FLOAT` }

    try {
        const bin_parser = PARSERS_MAP[buffer.length][data_type];
        /** @type {number} */
        const parsed_value = new bin_parser(buffer.buffer)[0];
        return { ok: parsed_value };
    } catch (e) {
        return { err: `Binary Parser Error: ${e}` }
    }
}

/**
 * @param {number} num
 * @returns {Result}
 */
function u16_to_2u8(num) {
    if (num < 0 || num > 65535)
        return { err: 'Number Is not Valid u16' };

    const lsb = num & 0xFF;
    const msb = (num >> 8) & 0xFF;
    return { ok: new Uint8Array([lsb, msb]) };
}

/**
 * @param {number} data_type
 * @param {number} data_length
 * @param {number} msg_type
 * @returns {Result}
 */
function gen_cfg1(data_type, data_length, msg_type) {
    // data type bits
    if (!(Object.values(DataTypes).includes(data_type)))
        return { err: 'Invalid Data Type Bits' };
    const data_type_bits = data_type.toString(2).padStart(2, '0');

    // data length bits
    if (!(Object.keys(PARSERS_MAP).includes(data_length.toString())))
        return { err: 'Invalid Data Length Bits' };
    const data_length_bits = Math.log2(data_length).toString(2).padStart(2, '0');

    // msg type bits
    if (!(Object.values(MsgTypes).includes(msg_type)))
        return { err: 'Invalid Msg Type Bits' };
    const msg_type_bits = msg_type.toString(2).padStart(4, '0');

    const cfg1_bits = data_type_bits + data_length_bits + msg_type_bits;
    return { ok: parseInt(cfg1_bits, 2) };
}

/**
 * @param {Uint8Array[]} arrays
 * @returns {Uint8Array}
 */
function concat_uint8_arrays(arrays) {
    let total_len = 0;
    for (const arr of arrays) {
        total_len += arr.length;
    }

    const out_arr = new Uint8Array(total_len);
    let offset = 0;
    for (const arr of arrays) {
        out_arr.set(arr, offset);
        offset += arr.length;
    }
    return out_arr;
}

/**
 * @param {number} msg_value
 * @param {number} data_length
 * @returns {Result}
 */
function gen_data_payload(data_type, data_length, msg_value) {
    // data length bits
    if (!(Object.keys(PARSERS_MAP).includes(data_length.toString())))
        return { err: `Data Type [${data_type}:${DataTypesStr[data_type]}] Has no Binary Parser` };

    const parser = PARSERS_MAP[data_length][data_type];
    const raw_buffer = new ArrayBuffer(data_length);
    const data_buffer = new parser(raw_buffer);
    const ui8_buffer = new Uint8Array(raw_buffer);
    data_buffer[0] = msg_value;
    return { ok: ui8_buffer };
}
// </utils>

// <module_api>
/**
 * @param {Uint8Array} packet
 * @returns {Result}
 */
function decode_packet(packet) {
    if (packet.length <= PACKET_MIN_LENGTH)
        return { err: 'Packet Too Small' };

    // crc16 check
    const packet_crc16_bytes = packet.slice(packet.length - 4, packet.length - 2);
    const packet_crc16 = new Uint16Array(packet_crc16_bytes.buffer)[0];
    const computed_crc16 = compute_crc16(packet.slice(0, packet.length - 4));
    if (packet_crc16 !== computed_crc16)
        return {
            err: {
                msg: 'Invalid CRC-16',
                detail: `packet_crc16=${packet_crc16}, computed_crc16=${computed_crc16}`,
            }
        };

    // packet start bytes
    const version_byte_1 = packet[0];
    const version_byte_2 = packet[1];
    if (version_byte_1 !== version_byte_2)
        return { err: 'Version Bytes Mismatch' };
    /** @type {DeviceMsg} */
    let device_msg = {};
    device_msg.protocol_version = version_byte_1;

    // packet length byte
    if (packet.length !== packet[2])
        return {
            err: {
                msg: 'Packet Length Mismatch',
                detail: `packet[2]=${packet[2]}, packet.length=${packet.length}`,
            }
        };
    device_msg.packet_length = packet[2];

    // packet sequence number
    const seq_number_bytes = packet.slice(3, 5);
    let result = bin_parse(seq_number_bytes, DataTypes.UINT);
    if (result.err)
        return result;
    device_msg.seq_number = result.ok;

    // decode config byte 1
    const cfg1_bits = bin_byte(packet[5]);
    // data_type
    const data_type_bits = cfg1_bits.slice(0, 2);
    const data_type = parseInt(data_type_bits, 2);
    if (!(Object.values(DataTypes).includes(data_type)))
        return {
            err: {
                msg: 'Invalid Data Type Bits',
                detail: `data_type_bits=${data_type_bits}`,
            }
        };
    device_msg.data_type = data_type;
    device_msg.data_type_str = DataTypesStr[data_type]
    // data_length
    const data_length_bits = cfg1_bits.slice(2, 4);
    const data_length = 2 ** parseInt(data_length_bits, 2);
    if (data_length !== (packet.length - PACKET_MIN_LENGTH))
        return {
            err: {
                msg: 'Invalid Data Length Bits',
                detail: `data_length_bits=${data_length_bits}, Packet Data Size: ${packet.length - PACKET_MIN_LENGTH}`,
            }
        };
    device_msg.data_length = data_length;
    // msg_type
    const msg_type_bits = cfg1_bits.slice(4, 8);
    const msg_type = parseInt(msg_type_bits, 2);
    if (!(Object.values(MsgTypes).includes(msg_type)))
        return {
            err: {
                msg: 'Invalid Msg Type Bits',
                detail: `msg_type_bits=${msg_type_bits}`,
            }
        };
    device_msg.msg_type = msg_type;
    device_msg.msg_type_str = MsgTypesConfig[msg_type].name;

    // decode config byte 2
    const cfg2_bits = bin_byte(packet[6]);
    device_msg.cfg2 = cfg2_bits;

    // parse data payload
    const data_payload = packet.slice(DATA_START, DATA_START + data_length);
    // base64 encode data payload
    device_msg.b64_msg_buffer = btoa(String.fromCharCode.apply(null, data_payload));
    result = bin_parse(data_payload, data_type);
    if (result.err)
        return result;
    device_msg.msg_value = result.ok;
    return { ok: device_msg };
}

/**
 * @param {number} protocol_version
 * @param {number} seq_number
 * @param {number} msg_type
 * @param {number} msg_value
 * @returns {Result}
 */
function encode_packet(protocol_version, seq_number, msg_type, msg_value) {
    if (!(Object.keys(MsgTypesConfig).includes(msg_type.toString())))
        return { err: 'Msg Type Has no Configuration' };

    const cfg2 = '00000000';
    const { data_length, data_type } = MsgTypesConfig[msg_type];
    const start_seg = new Uint8Array([protocol_version, protocol_version, (PACKET_MIN_LENGTH + data_length)]);

    let result = u16_to_2u8(seq_number);
    if (result.err)
        return result;
    const seq_number_seg = result.ok;

    result = gen_cfg1(data_type, data_length, msg_type);
    if (result.err)
        return result;
    const cfg_seg = new Uint8Array([result.ok, parseInt(cfg2, 2)]);

    result = gen_data_payload(data_type, data_length, msg_value);
    if (result.err)
        return result;
    const data_payload = result.ok;

    const seg_1 = concat_uint8_arrays([start_seg, seq_number_seg, cfg_seg, data_payload]);
    // compute crc16
    const crc16 = compute_crc16(seg_1);
    result = u16_to_2u8(crc16);
    if (result.err)
        return result;
    const crc16_bytes = result.ok;
    // construct final packet
    const end_seg = new Uint8Array([0x0D, 0x0A]);
    const packet = concat_uint8_arrays([seg_1, crc16_bytes, end_seg]);
    return { ok: packet }
}
// </module_api>

module.exports = { decode_packet, encode_packet, MsgTypes };
