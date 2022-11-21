const fs = require('fs');
const env = require('../../env');
const cookies = require('./cookies');
const logging = require('../logging/logging');

const { validSession } = require('./auth');
const { getAuthToken } = require('../encryption');

/**
 *
 * @param {*} user
 * @param {*} res
 */
function goHome(user, res) {
    const session = getAuthToken()
        .toString('hex');

    logging.debug('User:', JSON.stringify(user, null, 4));

    res.cookie('user', user.id, { maxAge: 900000, httpOnly: true });
    res.cookie('session', session, { maxAge: 900000, httpOnly: true });

    fs.writeFile(env.sessionPath(user.id), session, (err) => {
        if (err)
            logging.error(err);

        res.sendFile(env.homePath());
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function index(req, res) {
    logging.info('Request made to panel.');

    const { user, session } = cookies.getAll(req);

    if (!user || !session || !/\d{18}/.test(user))
        res.sendFile(env.loginPath());
    else if (validSession(user, session))
        goHome({ id: user }, res);
    else {
        fs.readFile(env.sessionPath(user), (err, data) => {
            if (err) {
                logging.error(err);
                res.sendFile(env.loginPath());
            }
            else if (data.toString() === session) {
                goHome({ id: user }, res);
            }
            else {
                logging.info('Failed login attempt using session.', user);
                res.sendFile(env.loginPath());
            }
        });
    }
}

module.exports = {
    goHome,
    index
};