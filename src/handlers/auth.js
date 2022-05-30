const fs = require('fs');
const axios = require('axios');
const qr = require('qr-image');
const env = require('../../env');
const speakeasy = require('speakeasy');
const logging = require('../logging/logging');

const { validate } = require('./validation');
const { encrypt, decrypt } = require('../encryption');
const { userPath, twoFA, users, userIsCached, cacheUser, getUserById } = require('../../env');

/**
 *
 */
function init() {
    if (!fs.existsSync(users)) {
        fs.mkdir(users, { recursive: true }, (err) => {
            if (err)
                logging.error(err);
        });
    }
}

/**
 *
 * @returns
 */
function getAuth() {
    const secretCode = speakeasy.generateSecret(
        {
            name: twoFA
        }
    );

    return {
        otpauthUrl: secretCode.otpauth_url,
        base32: secretCode.base32
    };
}

/**
 *
 * @returns
 */
function randomPin() {
    let str = [];
    for (let i = 0; i < 8; i++)
        str.push(Math.floor(Math.random() * 9));

    return str.join('');
}

/**
 *
 * @param {*} userId
 * @param {*} pin
 * @param {*} token
 * @returns {Promise<Buffer>}
 */
function accountSetup(userId, pin, token = null) {
    logging.debug('Account setup:', userId);

    const path = userPath(userId);

    if (!fs.existsSync(path))
        return Promise.reject(new Error('account-not-found'));

    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err)
                reject(err);
            else if (token === null) { // Set 2FA secret
                logging.debug('Token is null. Respond with QR image.');

                try {
                    const file = decrypt(userId, userId, data);
                    const user = JSON.parse(file.toString());

                    if (user.tempPin !== null && user.tempPin === pin) {
                        const img = qr.image(user.twofaUrl);

                        const buffer = [];

                        img.on('data', (c) => buffer.push(c));
                        img.once('end', () => resolve(Buffer.concat(buffer)));
                    }
                    else {
                        reject(new Error('invalid-pin'));
                    }
                }
                catch (err) {
                    reject(err);
                }
            }
            else {
                logging.debug('Validating token and setting new pin.');

                try {
                    const file = decrypt(userId, userId, data);
                    const user = JSON.parse(file.toString());

                    const valid = speakeasy.totp.verify(
                        {
                            secret: user.secret,
                            encoding: 'base32',
                            token: token
                        }
                    );

                    if (valid) {
                        logging.debug('Valid! Setting and encrypting.');

                        const file = decrypt(userId, userId, data);
                        const user = JSON.parse(file.toString());

                        user.pin = pin;
                        user.tempPin = null;

                        fs.writeFile(path, encrypt(userId, pin, JSON.stringify(user)), (err) => {
                            if (err)
                                reject(err);
                            else
                                resolve(null);
                        });
                    }
                    else {
                        logging.error('Invalid token.');
                        logging.audit('Failed login validation:', getUserById(userId));

                        reject(new Error('invalid-token'));
                    }
                }
                catch (err) {
                    logging.error(err);
                    reject(err);
                }
            }
        });
    });
}

/**
 *
 * @param {string} userId
 * @param {string} session
 * @returns
 */
function validSession(userId, session) {
    const path = env.sessionPath(userId);

    if (!userId || !session)
        return false;

    if (fs.existsSync(path)) {
        const currentSession = fs.readFileSync(path, 'utf-8');

        return currentSession === session;
    }

    return false;
}

module.exports = {
    init,
    validSession,
    register(req, res) {
        const { guildId, channelId, userId } = req.body;
        const auth = getAuth();

        if (!fs.existsSync(users)) {
            fs.mkdir(users, { recursive: true }, (err) => {
                if (err)
                    logging.error(err);
            });
        }

        if (fs.existsSync(userPath(userId))) {
            logging.audit(`Registering new user [${getUserById(userId)}] - file already exists.`);

            res.send('already-exists');

            return;
        }

        const user = {
            guildId,
            channelId,
            userId,
            pin: null,
            tempPin: randomPin(),
            twofaUrl: auth.otpauthUrl,
            secret: auth.base32
        };

        try {
            const file = encrypt(userId, userId, JSON.stringify(user));

            fs.writeFile(userPath(userId), file, (err) => {
                if (err) {
                    logging.error(err);
                    res.send(err);
                }
                else {
                    logging.audit('Created user file for:', getUserById(userId));
                    res.send({ guildId, channelId, userId, tempPin: user.tempPin });
                }
            });
        }
        catch (err) {
            logging.error(err);
            res.send(err);
        }
    },
    generate(req, res) {
        const { userId, pin } = req.body;

        const path = userPath(userId);

        if (!fs.existsSync(path)) {
            res.send('not-found');

            return;
        }

        fs.readFile(path, (err, data) => {
            if (err) {
                logging.error(err);
                res.send(err);
            }
            else {
                try {
                    const file = decrypt(userId, userId, data);
                    const user = JSON.parse(file.toString());

                    user.pin = pin;
                    user.tempPin = null;

                    const img = qr.image(user.twofaUrl);

                    const buffer = [];

                    img.on('data', (c) => buffer.push(c));
                    img.once('end', () => {
                        fs.writeFile(path, encrypt(userId, user.pin, JSON.stringify(user)), (err) => {
                            if (err) {
                                logging.error(err);
                                res.send(err);
                            }
                            else {
                                logging.audit('Generated new 2FA URL for user:', getUserById(userId));

                                res.setHeader('Content-Type', 'image/png');
                                res.send(Buffer.concat(buffer));
                            }
                        });
                    });
                }
                catch (err) {
                    logging.error(err);
                    res.send(err);
                }
            }
        });
    },
    validate(req, res) {
        const { userId, pin, twofaToken } = req.body;

        validate(userId, pin, twofaToken)
            .then((valid) => res.send({ valid }))
            .catch((err) => res.send(err));
    },
    login(req, res, goHome) {
        const { username, pin, token } = req.body;
        const spl = username.split('#');
        const name = spl[0],
            discriminator = spl[1];

        const checkWhitelist = () => {
            return new Promise((resolve, reject) => {
                if (fs.existsSync(env.datapath + '/whitelist.txt')) {
                    logging.debug('Whitelist exists. Checking...');

                    fs.readFile(env.datapath + '/whitelist.txt', (err, data) => {
                        if (err) {
                            logging.error('Failed to read whitelist file.');
                            resolve(null);
                        }
                        else {
                            const whitelist = data.toString().split('\n');

                            console.log(whitelist);

                            if (whitelist.includes(username)) {
                                logging.info('User exists in whitelist.');
                                logging.audit('User logging in from whitelist:', username);

                                userIsCached(`${name}#${discriminator}`)
                                    .then((userId) => {
                                        if (userId) {
                                            logging.debug('User is cached:', userId);
                                            resolve({ id: userId });
                                        }
                                        else {
                                            logging.debug('User is not cached.');
                                            resolve(null);
                                        }
                                    })
                                    .catch(reject);
                            }
                            else {
                                logging.info('User does not exist in whitelist.');
                                resolve(null);
                            }
                        }
                    });
                }
                else
                    resolve(null);
            });
        };

        const login = (user) => {
            logging.debug('Token is defined. Validating');

            validate(user.id, pin, token)
                .then((valid) => {
                    if (valid) {
                        logging.debug('Valid. Redirecting to home.');
                        logging.audit('User login:', username);

                        goHome(user, res);
                    }
                    else {
                        logging.debug('Invalid login attempt:', user);
                        logging.audit('Failed user login:', username);

                        res.redirect('/?status=invalid');
                    }
                })
                .catch((err) => {
                    if (err === null) {
                        res.redirect('/?status=account-not-found');
                    }
                    else {
                        logging.error(err);

                        accountSetup(user.id, pin, token)
                            .then(() => {
                                logging.debug('Setup?');
                                res.redirect('/?status=complete');
                            })
                            .catch((err) => {
                                logging.error(err);
                                res.redirect(`/?status=${err.message}`);
                            });
                    }
                });
        };

        const getUserFromBot = () => {
            axios.default.get(`http://localhost:8001/user/id?username=${name}&discriminator=${discriminator}`, { responseType: 'json' })
                .then((response) => {
                    const users = response.data;
                    const user = users[0];

                    // No user found. Have they run ~login or typed in chat?
                    if (!user) {
                        logging.debug('Not cached on Discord.');
                        res.redirect('/?status=discord');
                    }
                    else if (token === '000000') {
                        logging.debug('Token reset?');

                        accountSetup(user.id, pin)
                            .then((img) => {
                                logging.audit('Sending 2FA QR image for:', username);

                                const page = `<img src="data:image/png;base64,${img.toString('base64')}" />`;
                                res.send(page);
                            })
                            .catch((err) => {
                                logging.error(err);
                                res.redirect('/?status=' + err.message);
                            });
                    }
                    else {
                        cacheUser(`${name}#${discriminator}`, user)
                            .then(() => {
                                login(user);
                            })
                            .catch((err) => {
                                logging.error(err);
                                res.redirect('/?status=cache-failure');
                            });
                    }
                })
                .catch((err) => {
                    logging.error('Failed to connect to bot:', err.message);

                    userIsCached(`${name}#${discriminator}`)
                        .then((user) => {
                            if (user) {
                                logging.debug('User is cached.');
                                login(user);
                            }
                            else
                                res.redirect('/?status=bot-failure');
                        })
                        .catch((err) => {
                            logging.error(err);
                            res.redirect('/?status=bot-failure');
                        });
                });
        };

        checkWhitelist()
            .then((user) => {
                if (user !== null)
                    goHome(user, res);
                else
                    getUserFromBot();
            })
            .catch((err) => {
                logging.error(err);
                getUserFromBot();
            });
    }
};