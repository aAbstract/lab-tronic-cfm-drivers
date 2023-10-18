const { screen } = require('../lib/ui_core');
// ui components
const rol_log = require('./components/rol_log');
const kpis = require('./components/kpis');
const device_control = require('./components/device_control');
const single_chart = require('./components/single_chart');
const overlay_chart = require('./components/overlay_chart');

function init_main_layout() {
    rol_log.render();
    kpis.render();
    device_control.render();
    single_chart.render();
    overlay_chart.render();
    screen.render();
}

module.exports = { init_main_layout };
