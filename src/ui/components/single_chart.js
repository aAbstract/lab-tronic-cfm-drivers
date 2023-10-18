const blessed_contrib = require('blessed-contrib');
const ui_core = require('../../lib/ui_core');

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
