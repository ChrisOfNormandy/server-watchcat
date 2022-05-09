const fs = require('fs');
const env = require('../../env');
const { getAuthToken } = require('../encryption');
const logging = require('../logging/logging');

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
        logging.info('Request made to index.');

        if (!req.cookies || !req.cookies.user || !req.cookies.session) {
            res.sendFile(env.loginPath());
        }
        else {
            const { user, session } = req.cookies;

            const path = env.sessionPath(user);

            if (fs.existsSync(path))
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
    }
};