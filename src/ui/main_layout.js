const { screen } = require('../lib/ui_core');
// ui components
const rol_log = require('./components/rol_log');
const kpis = require('./components/kpis');

function init_main_layout() {
    rol_log.render();
    kpis.render();
    // const main_col = new blessed_contrib.grid({ rows: 10, cols: 1, screen: screen });

    // const single_chart_cont = main_col.set(0, 0, 2, 1, blessed.box, { label: 'Single Chart' });
    // const overlay_chart_cont = main_col.set(2, 0, 3, 1, blessed.box, { label: 'Overlay Chart' });
    // const kpi_cont = main_col.set(5, 0, 2, 1, blessed.box, { label: 'KPIs' });
    // main_col.set(7, 0, 2, 1, blessed.box);
    // const control_cont = main_col.set(9, 0, 1, 1, blessed.box, { label: 'Device Control' });
    screen.render();
}

module.exports = { init_main_layout };
