const blessed_contrib = require('blessed-contrib');
const ui_core = require('../../lib/ui_core');
const { MsgTypes } = require('../../lib/serial_driver');

const points_data = {
    [MsgTypes.READ_PISTON_PUMP]: {
        x: [],
        y: [],
        color: 'yellow',
    },
    [MsgTypes.READ_PERISTALTIC_PUMP]: {
        x: [],
        y: [],
        color: 'magenta',
    },
    [MsgTypes.READ_WEIGHT]: {
        x: [],
        y: [],
        color: 'green',
    },
    [MsgTypes.READ_TEMPERATURE]: {
        x: [],
        y: [],
        color: 'red',
    },
    [MsgTypes.READ_PRESSURE]: {
        x: [],
        y: [],
        color: 'blue',
    },
};

function render() {
    /** @type {blessed_contrib.Widgets.LineElement} */
    const overlay_chart_comp = ui_core.main_grid.set(0, 10, 8, 10, blessed_contrib.line, { label: 'OVERLAY_CHART' });

    ui_core.add_ui_event('device_msg', 'device_msg_overlay_chart_handler', args => {
        /** @type {import('../../lib/serial_driver').DeviceMsg} */
        const device_msg = args.device_msg;
        const { msg_type, seq_number, msg_value } = device_msg;
        if (points_data[msg_type].x.length >= 240) {
            points_data[msg_type].x.shift();
            points_data[msg_type].y.shift();
        }
        points_data[msg_type].x.push(String(seq_number));
        points_data[msg_type].y.push(msg_value);

        overlay_chart_comp.setData([
            {
                style: { line: points_data[MsgTypes.READ_TEMPERATURE].color },
                x: points_data[MsgTypes.READ_TEMPERATURE].x,
                y: points_data[MsgTypes.READ_TEMPERATURE].y,
            },
            {
                style: { line: points_data[MsgTypes.READ_WEIGHT].color },
                x: points_data[MsgTypes.READ_WEIGHT].x,
                y: points_data[MsgTypes.READ_WEIGHT].y,
            },
            {
                style: { line: points_data[MsgTypes.READ_PRESSURE].color },
                x: points_data[MsgTypes.READ_PRESSURE].x,
                y: points_data[MsgTypes.READ_PRESSURE].y,
            },
        ]);
    });
}

module.exports = { render };
