const serial_adapter = require('./lib/serial_adapter');
const main_layout = require('./ui/main_layout');

// init ui
main_layout.init_main_layout();

// init serial port
const SP_NAME = '/dev/ttyACM0';
const BAUD_RATE = 115200;
serial_adapter.init_serial_adapter(SP_NAME, BAUD_RATE);
