const blessed = require('blessed');
const ui_core = require('../../lib/ui_core');
const { MsgTypes } = require('../../lib/serial_driver');

let MsgTypesCompMap = null;

function render() {
    const temp_kpi_comp = ui_core.main_grid.set(5, 0, 2, 1, blessed.box, {
        label: 'TEMPERATURE',
        content: '-- --',
        style: {
            fg: 'red',
            bold: true,
        },
        align: 'center',
        valign: 'middle',
    });

    const weight_kpi_comp = ui_core.main_grid.set(5, 1, 2, 1, blessed.box, {
        label: 'WEIGHT',
        content: '-- --',
        style: {
            fg: 'green',
            bold: true,
        },
        align: 'center',
        valign: 'middle',
    });

    const pres_kpi_comp = ui_core.main_grid.set(5, 2, 2, 1, blessed.box, {
        label: 'PRESSURE',
        content: '-- --',
        style: {
            fg: 'blue',
            bold: true,
        },
        align: 'center',
        valign: 'middle',
    });

    const pis_pump_kpi_comp = ui_core.main_grid.set(5, 3, 2, 1, blessed.box, {
        label: 'PISTON_PUMP',
        content: '-- --',
        style: {
            fg: 'yellow',
            bold: true,
        },
        align: 'center',
        valign: 'middle',
    });

    const per_pump_kpi_comp = ui_core.main_grid.set(5, 4, 2, 1, blessed.box, {
        label: 'PERISTALTIC_PUMP',
        content: '-- --',
        style: {
            fg: 'magenta',
            bold: true,
        },
        align: 'center',
        valign: 'middle',
    });

    if (!MsgTypesCompMap) {
        MsgTypesCompMap = {
            [MsgTypes.READ_PISTON_PUMP]: {
                comp: pis_pump_kpi_comp,
                unit: 'RPM',
                data_view: (/** @type {number} */ msg_value) => { return msg_value.toFixed(); },
            },
            [MsgTypes.READ_PERISTALTIC_PUMP]: {
                comp: per_pump_kpi_comp,
                unit: '',
                data_view: (/** @type {number} */ msg_value) => {
                    const msg_value_map = {
                        0: 'STOP',
                        1: 'LOW',
                        2: 'MEDIUM',
                        3: 'HIGH',
                    };
                    return msg_value_map[msg_value];
                },
            },
            [MsgTypes.READ_WEIGHT]: {
                comp: weight_kpi_comp,
                unit: 'g',
                data_view: (/** @type {number} */ msg_value) => { return msg_value.toFixed(2); },
            },
            [MsgTypes.READ_TEMPERATURE]: {
                comp: temp_kpi_comp,
                unit: 'C',
                data_view: (/** @type {number} */ msg_value) => { return msg_value.toFixed(2); },
            },
            [MsgTypes.READ_PRESSURE]: {
                comp: pres_kpi_comp,
                unit: 'Bar',
                data_view: (/** @type {number} */ msg_value) => { return msg_value.toFixed(2); },
            },
        };
    }

    ui_core.add_ui_event('device_msg', 'device_msg_kpi_handler', args => {
        /** @type {import('../../lib/serial_driver').DeviceMsg} */
        const device_msg = args.device_msg;
        /** @type {blessed.Widgets.BoxElement} */
        const kpi_comp = MsgTypesCompMap[device_msg.msg_type].comp;
        /** @type {string} */
        const kpi_unit = MsgTypesCompMap[device_msg.msg_type].unit;
        const data_view = MsgTypesCompMap[device_msg.msg_type].data_view;
        // kpi_comp.setContent(`${device_msg.msg_value.toFixed(3)} ${kpi_unit}`);
        kpi_comp.setContent(`${data_view(device_msg.msg_value)} ${kpi_unit}`);
    });
}

module.exports = { render };
