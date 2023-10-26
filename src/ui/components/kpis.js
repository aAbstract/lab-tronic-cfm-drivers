const blessed = require('blessed');
const ui_core = require('../../lib/ui_core');
const { MsgTypes } = require('../../lib/serial_driver');

const START_ROW = 8;
const KPI_WIDTH = 4;
const KPI_HEIGHT = 2;
let MsgTypesCompMap = null;

function render() {
    /** @type {blessed.Widgets.ButtonElement} */
    const temp_kpi_comp = ui_core.main_grid.set(START_ROW, 0, KPI_HEIGHT, KPI_WIDTH, blessed.button, {
        label: 'TEMPERATURE [PT]',
        mouse: true,
        content: '-- --',
        style: {
            fg: 'red',
            bold: true,
            hover: {
                bg: 'red',
                fg: 'white',
            },
        },
        align: 'center',
        valign: 'middle',
    });

    /** @type {blessed.Widgets.ButtonElement} */
    const weight_kpi_comp = ui_core.main_grid.set(START_ROW, 1 * KPI_WIDTH, KPI_HEIGHT, KPI_WIDTH, blessed.button, {
        label: 'WEIGHT [PW]',
        mouse: true,
        content: '-- --',
        style: {
            fg: 'green',
            bold: true,
            hover: {
                bg: 'green',
                fg: 'white',
            },
        },
        align: 'center',
        valign: 'middle',
    });

    /** @type {blessed.Widgets.ButtonElement} */
    const pres_kpi_comp = ui_core.main_grid.set(START_ROW, 2 * KPI_WIDTH, KPI_HEIGHT, KPI_WIDTH, blessed.button, {
        label: 'PRESSURE [PP]',
        mouse: true,
        content: '-- --',
        style: {
            fg: 'blue',
            bold: true,
            hover: {
                bg: 'blue',
                fg: 'white',
            },
        },
        align: 'center',
        valign: 'middle',
    });

    const pis_pump_kpi_comp = ui_core.main_grid.set(START_ROW, 3 * KPI_WIDTH, KPI_HEIGHT, KPI_WIDTH, blessed.box, {
        label: 'PISTON_PUMP',
        content: '-- --',
        style: {
            fg: 'yellow',
            bold: true,
        },
        align: 'center',
        valign: 'middle',
    });

    const per_pump_kpi_comp = ui_core.main_grid.set(START_ROW, 4 * KPI_WIDTH, KPI_HEIGHT, KPI_WIDTH, blessed.box, {
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

    // event handlers
    function activate_temp_kpi() {
        temp_kpi_comp.style.bg = 'red';
        temp_kpi_comp.style.fg = 'white';

        pres_kpi_comp.style.bg = '';
        pres_kpi_comp.style.fg = 'blue';
        weight_kpi_comp.style.bg = '';
        weight_kpi_comp.style.fg = 'green';
        ui_core.trigger_ui_event('change_plot_param', { msg_type: MsgTypes.READ_TEMPERATURE });
    }
    temp_kpi_comp.on('press', activate_temp_kpi);
    ui_core.add_ui_event('select_TEMP_kpi', 'activate_temp_kpi', activate_temp_kpi);

    function activate_weight_kpi() {
        weight_kpi_comp.style.bg = 'green';
        weight_kpi_comp.style.fg = 'white';

        temp_kpi_comp.style.bg = '';
        temp_kpi_comp.style.fg = 'red';
        pres_kpi_comp.style.bg = '';
        pres_kpi_comp.style.fg = 'blue';
        ui_core.trigger_ui_event('change_plot_param', { msg_type: MsgTypes.READ_WEIGHT });
    }
    weight_kpi_comp.on('press', activate_weight_kpi);
    ui_core.add_ui_event('select_WGHT_kpi', 'activate_weight_kpi', activate_weight_kpi);

    function activate_pres_kpi() {
        pres_kpi_comp.style.bg = 'blue';
        pres_kpi_comp.style.fg = 'white';

        weight_kpi_comp.style.bg = '';
        weight_kpi_comp.style.fg = 'green';
        temp_kpi_comp.style.bg = '';
        temp_kpi_comp.style.fg = 'red';
        ui_core.trigger_ui_event('change_plot_param', { msg_type: MsgTypes.READ_PRESSURE });
    }
    pres_kpi_comp.on('press', activate_pres_kpi);
    ui_core.add_ui_event('select_PRES_kpi', 'activate_pres_kpi', activate_pres_kpi);

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

    activate_weight_kpi();
}

module.exports = { render };
