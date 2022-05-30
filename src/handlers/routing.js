const fs = require('fs');
const env = require('../../env');
const logging = require('../logging/logging');

const { getAuthToken } = require('../encryption');
const cookies = require('./cookies');
const { validSession } = require('./auth');

/**
 *
 * @param {*} user
 * @param {*} res
 */
function goHome(user, res) {
    const session = getAuthToken()
        .toString('hex');

    res.cookie('user', user.id, { maxAge: 900000, httpOnly: true });
    res.cookie('session', session, { maxAge: 900000, httpOnly: true });

    fs.writeFile(env.sessionPath(user.id), session, (err) => {
        if (err)
            logging.error(err);
    });

    res.sendFile(env.homePath());
}

module.exports = {
    goHome,
    index(req, res) {
        logging.info('Request made to panel.');

        const { user, session } = cookies.getAll(req);

        if (!user || !session)
            res.sendFile(env.loginPath());
        else if (validSession(user, session))
            goHome({ id: user }, res);
        else {
            fs.readFile(env.userPath(user), (err, data) => {
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
};