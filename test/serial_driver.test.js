const serial_driver = require('../src/lib/serial_driver');

// <test_utils>
function cmp_buffers(buffer_1, buffer_2) {
    if (buffer_1.length !== buffer_2.length)
        return false;

    for (let i = 0; i < buffer_1.length; i++)
        if (buffer_1[i] !== buffer_2[i])
            return false;

    return true;
}
// </test_utils>

test('test serial_driver.decode_packet', () => {
    // too small packet case
    let packet = new Uint8Array([0x00]);
    let result = serial_driver.decode_packet(packet);
    expect(result.err).toBe('Packet Too Small');

    // invalid crc16 case
    packet = new Uint8Array([0x87, 0x87, 0x0F, 0x00, 0x00, 0xA2, 0x00, 0x89, 0x41, 0x10, 0x40, 0xA5, 0x1A, 0x0D, 0x0A]);
    result = serial_driver.decode_packet(packet);
    expect(result.err.msg).toBe('Invalid CRC-16');

    // version bytes mismatch case
    packet = new Uint8Array([0x87, 0x88, 0x0F, 0x00, 0x00, 0xA2, 0x00, 0x89, 0x41, 0x10, 0x40, 0x78, 0xB7, 0x0D, 0x0A]);
    result = serial_driver.decode_packet(packet);
    expect(result.err).toBe('Version Bytes Mismatch');

    // packet length mismatch case
    packet = new Uint8Array([0x87, 0x87, 0x0A, 0x00, 0x00, 0xA2, 0x00, 0x89, 0x41, 0x10, 0x40, 0xBC, 0x68, 0x0D, 0x0A]);
    result = serial_driver.decode_packet(packet);
    expect(result.err.msg).toBe('Packet Length Mismatch');

    // data length mismatch case
    packet = new Uint8Array([0x87, 0x87, 0x0F, 0x00, 0x00, 0x10, 0x00, 0x89, 0x41, 0x10, 0x40, 0x80, 0xD0, 0x0D, 0x0A]);
    result = serial_driver.decode_packet(packet);
    expect(result.err.msg).toBe('Invalid Data Length Bits');

    // invalid msg type case
    packet = new Uint8Array([0x87, 0x87, 0x0F, 0x00, 0x00, 0x2E, 0x00, 0x89, 0x41, 0x10, 0x40, 0xF2, 0x2E, 0x0D, 0x0A]);
    result = serial_driver.decode_packet(packet);
    expect(result.err.msg).toBe('Invalid Msg Type Bits');

    // valid case
    packet = new Uint8Array([0x87, 0x87, 0x0F, 0x00, 0x00, 0xA2, 0x00, 0x89, 0x41, 0x10, 0x40, 0xA4, 0x1A, 0x0D, 0x0A]);
    result = serial_driver.decode_packet(packet);
    expect(result.ok).toBeDefined();
    let device_msg = result.ok;
    device_msg.msg_value = Number(device_msg.msg_value.toFixed(3));
    expect(device_msg).toEqual({
        protocol_version: 135,
        packet_length: 15,
        seq_number: 0,
        data_type: 2,
        data_type_str: 'FLOAT',
        data_length: 4,
        msg_type: 2,
        msg_type_str: 'READ_WEIGHT',
        cfg2: '00000000',
        b64_msg_buffer: 'iUEQQA==',
        msg_value: 2.254
    });
});

test('test serianl_driver.encode_packet', () => {
    // invalid seq number case
    let result = serial_driver.encode_packet(135, 70000, serial_driver.MsgTypes.READ_WEIGHT, 2.254);
    expect(result.err).toBe('Number Is not Valid u16');
    result = serial_driver.encode_packet(135, -1, serial_driver.MsgTypes.READ_WEIGHT, 2.254);
    expect(result.err).toBe('Number Is not Valid u16');

    // invalid msg type case
    result = serial_driver.encode_packet(135, 0, 14, 2.254);
    expect(result.err).toBe('Msg Type Has no Configuration');

    // encode data packet case
    let target_packet = new Uint8Array([0x87, 0x87, 0x0F, 0x00, 0x00, 0xA2, 0x00, 0x89, 0x41, 0x10, 0x40, 0xA4, 0x1A, 0x0D, 0x0A]);
    result = serial_driver.encode_packet(135, 0, serial_driver.MsgTypes.READ_WEIGHT, 2.254);
    expect(result.ok).toBeDefined();
    expect(cmp_buffers(target_packet, result.ok)).toBe(true);

    // encode command packet case
    target_packet = new Uint8Array([0x87, 0x87, 0x0C, 0xFF, 0xFF, 0xCF, 0x00, 0xFF, 0xC3, 0xDB, 0x0D, 0x0A]);
    result = serial_driver.encode_packet(135, 0xFFFF, serial_driver.MsgTypes.WRITE_RESET_SCALE, 0xFF);
    expect(result.ok).toBeDefined();
    expect(cmp_buffers(target_packet, result.ok)).toBe(true);
});
