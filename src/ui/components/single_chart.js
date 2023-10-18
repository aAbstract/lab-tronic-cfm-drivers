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
        color: 'yellow',
    },
    [MsgTypes.READ_TEMPERATURE]: {
        x: [],
        y: [],
        color: 'yellow',
    },
    [MsgTypes.READ_PRESSURE]: {
        x: [],
        y: [],
        color: 'yellow',
    },
};

function render() {
    /** @type {blessed_contrib.Widgets.LineElement} */
    const single_chart_comp = ui_core.main_grid.set(0, 0, 5, 3, blessed_contrib.line, {
        label: 'SINGLE_CHART',
        style: {
            line: 'yellow',
        },
    });

    single_chart_comp.setData([{
        x: [0, 1, 2, 3, 5, 6, 7],
        y: [5, 1, 7, 5, 7, 7, 7],
    }]);
}

module.exports = { render };
