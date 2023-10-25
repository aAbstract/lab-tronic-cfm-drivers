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
});
sp_name = sp_name;
const parser = new DelimiterParser({ delimiter: Buffer.from([0x0D, 0x0A]), includeDelimiter: true });
sp.pipe(parser);

ui_core.trigger_ui_event('add_sys_log', {
    log_msg: {
        module_id: func_id,
        level: 'INFO',
        msg: 'Connected to Device Serial Port',
    },
});
ui_core.trigger_ui_event('add_sys_log', {
    log_msg: {
        module_id: func_id,
        level: 'ERROR',
        msg: `Could not Connect to Port: ${sp_name}, Baud Rate: ${baud_rate}`,
    },
});

function send_reset_scale() {
    if (sp === null)
        return { err: `Serial Port [${sp_name}] is not Connected` };
    const packet = Buffer.from([0x87, 0x87, 0x0B, 0x00, 0x00, 0xCF, 0x00, 0x88, 0xDA, 0x0D, 0x0A]);
    console.log(`Writing: ${new Uint8Array(packet)}`);
    sp.write(packet);
    return { ok: 'OK' };
}

// [MsgTypes.READ_PISTON_PUMP]: {
//     x: [],
//     y: [],
//     color: 'yellow',
// },
// [MsgTypes.READ_PERISTALTIC_PUMP]: {
//     x: [],
//     y: [],
//     color: 'magenta',
// },

overlay_chart_comp.setData([
    {
        style: { line: 'red' },
        x: [0, 1, 2, 3, 4, 5],
        y: [2, 1, 4, 5, 5, 5],
    },
    {
        style: { line: 'green' },
        x: [0, 1, 2, 3, 4, 5],
        y: [4, 2, 8, 9, 9],
    },
]);