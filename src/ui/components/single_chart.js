const blessed_contrib = require('blessed-contrib');
const ui_core = require('../../lib/ui_core');
const { MsgTypes } = require('../../lib/serial_driver');

const MSG_TYPES_LABLES = {
    [MsgTypes.READ_TEMPERATURE]: 'TEMPERATURE',
    [MsgTypes.READ_WEIGHT]: 'WEIGHT',
    [MsgTypes.READ_PRESSURE]: 'PRESSURE',
};

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
let selected_param = MsgTypes.READ_WEIGHT;

function render() {
    /** @type {blessed_contrib.Widgets.LineElement} */
    const single_chart_comp = ui_core.main_grid.set(0, 0, 8, 10, blessed_contrib.line, {
        label: MSG_TYPES_LABLES[selected_param],
        style: { line: points_data[selected_param].color },
    });

    ui_core.add_ui_event('device_msg', 'device_msg_single_chart_handler', args => {
        /** @type {import('../../lib/serial_driver').DeviceMsg} */
        const device_msg = args.device_msg;
        const { msg_type, seq_number, msg_value } = device_msg;
        if (points_data[msg_type].x.length >= 240) {
            points_data[msg_type].x.shift();
            points_data[msg_type].y.shift();
        }
        points_data[msg_type].x.push(String(seq_number));
        points_data[msg_type].y.push(msg_value);

        single_chart_comp.setData([{
            x: points_data[selected_param].x,
            y: points_data[selected_param].y,
        }]);
    });

    ui_core.add_ui_event('change_plot_param', 'change_plot_param_func', args => {
        selected_param = args.msg_type;
        single_chart_comp.style.line = points_data[selected_param].color;
        single_chart_comp.setLabel(MSG_TYPES_LABLES[selected_param]);

        ui_core.trigger_ui_event('add_sys_log', {
            log_msg: {
                module_id: '',
                level: 'INFO',
                msg: `Switched Single Plot to ${MSG_TYPES_LABLES[selected_param]} Channel`,
            },
        });
    });
}

module.exports = { render };
