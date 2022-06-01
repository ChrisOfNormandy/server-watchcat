const fs = require('fs');
const logging = require('../../logging/logging');

const { datapath, cacheUser } = require('../../../env');

/**
 *
 * @returns
 */
function randomId() {
    const n = '0123456789';
    const id = [];

    while (id.length < 18)
        id.push(n[Math.round(Math.random() * (n.length - 1))]);

    return id.join('');
}

/**
 *
 * @param {string} user
 */
function add(user) {
    const whitelist = datapath + '/whitelist.txt';

    if (!fs.existsSync(whitelist))
        fs.writeFileSync(whitelist, '', 'utf-8');

    fs.readFile(whitelist, (err, data) => {
        const users = data.toString().split('\n');

        if (users.includes(user))
            logging.info('Whitelist already contains user.');
        else {
            fs.appendFile(whitelist, user + '\n', 'utf-8', (err) => {
                if (err)
                    logging.error('Failed to append user to whitelist.');
                else
                    logging.info('Added user to whitelist.');
            });
        }
    });

    let u = user.split('#');

    cacheUser(
        user,
        {
            id: randomId(),
            username: u[0],
            discriminator: u[1],
            tag: user,
            avatarURL: null
        }
    )
        .catch(logging.error);

    return true;
}

/**
 *
 */
function list() {
    const file = datapath + '/whitelist.txt';

    if (!fs.existsSync(file))
        fs.writeFileSync(file, '', 'utf-8');

    fs.readFile(file, (err, data) => {
        if (err)
            logging.error(err);
        else
            console.log('WHITELIST:\n', data.toString());
    });

    return true;
}

module.exports = {
    add,
    list
};