const blessed = require('blessed');
const blessed_contrib = require('blessed-contrib');

const screen = blessed.screen();
const ui_events = {};
// create vertical stack layout
const main_grid = new blessed_contrib.grid({ rows: 20, cols: 20, screen: screen });

/**
 * @param {string} event_type 
 * @param {string} func_id 
 * @param {Function} func 
 */
function add_ui_event(event_type, func_id, func) {
    if (!(event_type in ui_events))
        ui_events[event_type] = {};
    ui_events[event_type][func_id] = func;
}

/**
 * @param {string} event_type 
 * @param {string} func_id 
 */
function rm_ui_event(event_type, func_id) {
    delete ui_events[event_type][func_id];
    if (Object.keys(ui_events[event_type]).length === 0)
        delete ui_events[event_type];
}

/**
 * @param {string} event_type 
 * @param {any} args 
 */
function trigger_ui_event(event_type, args) {
    if (!(event_type in ui_events))
        return;
    Object.keys(ui_events[event_type]).forEach((/** @type {String} */ key) => {
        ui_events[event_type][key](args);
    });
    screen.render();
}

module.exports = { screen, main_grid, add_ui_event, rm_ui_event, trigger_ui_event };
