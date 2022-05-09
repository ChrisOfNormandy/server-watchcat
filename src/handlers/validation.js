const fs = require('fs');
const speakeasy = require('speakeasy');
const { userPath } = require('../../env');

const { decrypt } = require('../encryption');

/**
 *
 * @param {*} userId
 * @param {*} pin
 * @param {*} token
 * @returns {Promise<boolean>}
 */
function validate(userId, pin, token) {
    const path = userPath(userId);

    if (!fs.existsSync(path))
        return Promise.reject(new Error('User profile not found.'));

    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err)
                reject(err);
            else {
                try {
                    const file = decrypt(userId, pin, data);
                    const user = JSON.parse(file.toString());

                    const valid = speakeasy.totp.verify(
                        {
                            secret: user.secret,
                            encoding: 'base32',
                            token: token
                        }
                    );

                    resolve(valid && pin === user.pin);
                }
                catch (err) {
                    reject(err);
                }
            }
        });
    });
}

module.exports = {
    validate
};