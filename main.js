const serial_adapter = require('./serial_adapter');
const keyboard = require('./keyboard');
const csv = require('./csv');

const SP_NAME = '/dev/ttyUSB0';
const BAUD_RATE = 115200;

let data_cache = [];
serial_adapter.init_serial_adapter(
    SP_NAME,
    BAUD_RATE,
    (/** @type {import('./serial_driver').DeviceMsg} */ device_msg) => {
        console.log(device_msg);
        data_cache.push(device_msg);
    },
);

keyboard.init_keyboard({
    'w': () => { csv.save_csv(data_cache); },
    'r': () => {
        console.log('Sending Reset Scale Packet');
        const result = serial_adapter.send_reset_scale();
        if (result.err)
            console.log(result.err);
    },
});
