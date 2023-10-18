const blessed_contrib = require('blessed-contrib');
const ui_core = require('../../lib/ui_core');

function render() {
    /** @type {blessed_contrib.Widgets.LineElement} */
    const overlay_chart_comp = ui_core.main_grid.set(0, 3, 5, 2, blessed_contrib.line, { label: 'OVERLAY_CHART' });

    overlay_chart_comp.setData([
        {
            style: { line: 'red' },
            x: [0, 1, 2, 3, 4, 5],
            y: [2, 1, 4, 5, 5, 5],
        },
        {
            style: { line: 'green' },
            x: [0, 1, 2, 3, 4, 5],
            y: [4, 2, 8, 9, 9, 9],
        },
    ]);
}

module.exports = { render };
