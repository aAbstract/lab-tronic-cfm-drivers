const keypress = require('keypress');

function init_keyboard(key_funcs) {
    keypress(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    key_funcs['q'] = () => { process.exit(); };
    process.stdin.on('keypress', function (_, key) {
        if (key) {
            if (Object.keys(key_funcs).includes(key.name))
                key_funcs[key.name]();
            else
                console.log(`keyboard.init_keyboard [ERROR] unknown command [${key.name}]`);
        }
    });
}

module.exports = { init_keyboard };
