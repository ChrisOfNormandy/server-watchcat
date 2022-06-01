const readline = require('readline');
const logging = require('../logging/logging');

const whitelist = require('./cli/whitelist');

const commands = [
    {
        syntax: /^whitelist\s(.+#\d{4})$/,
        fn: whitelist.add
    },
    {
        syntax: /^whitelisted$/,
        fn: whitelist.list
    }
];

/**
 *
 */
function cli() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('', (input) => {
        rl.close();

        let output = null;
        for (let i = 0; i < commands.length; i++) {
            const match = input.match(commands[i].syntax);

            if (match !== null) {
                output = commands[i].fn(match[1]);
                break;
            }
        }

        if (output === null)
            logging.info('Command not found.');

        cli();
    });
}

module.exports = cli;