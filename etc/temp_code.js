// invalid data type case
packet = new Uint8Array([0x87, 0x87, 0x0F, 0x00, 0x00, 0xC0, 0x00, 0x89, 0x41, 0x10, 0x40, 0x43, 0x95, 0x0D, 0x0A]);
result = serial_driver.decode_packet(packet);
expect(result.err.msg).toBe('Invalid Data Type Bits');

let data_cache = [
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
];

setInterval(() => {
    /** @type {import('./ui/components/rol_log').LogMsg} */
    let log_msg = {
        module_id: 'main',
        level: 'INFO',
        msg: 'itick',
    };
    ui_core.trigger_ui_event('add_sys_log', { log_msg });

    log_msg = {
        module_id: 'main',
        level: 'DEBUG',
        msg: 'dtick',
    };
    ui_core.trigger_ui_event('add_sys_log', { log_msg });

    log_msg = {
        module_id: 'main',
        level: 'ERROR',
        msg: 'etick',
    };
    ui_core.trigger_ui_event('add_sys_log', { log_msg });
}, 1000);

const serial_adapter = require('./lib/serial_adapter');
const keyboard = require('./lib/keyboard');
const csv = require('./lib/csv');

keyboard.init_keyboard({
    'w': () => { csv.save_csv(data_cache); },
    'r': () => {
        console.log('Sending Reset Scale Packet');
        const result = serial_adapter.send_reset_scale();
        if (result.err)
            console.log(result.err);
    },
});