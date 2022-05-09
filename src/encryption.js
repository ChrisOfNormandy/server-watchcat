const crypto = require('crypto');

const ALGORITHM = {
    BLOCK_CIPHER: 'aes-256-gcm',
    AUTH_TAG_BYTE_LEN: 16,
    IV_BYTE_LEN: 12,
    KEY_BYTE_LEN: 32,
    SALT_BYTE_LEN: 16
};

const getIV = () => crypto.randomBytes(ALGORITHM.IV_BYTE_LEN);
//X const getRandomKey = () => crypto.randomBytes(ALGORITHM.KEY_BYTE_LEN);

//X const getSalt = () => crypto.randomBytes(ALGORITHM.SALT_BYTE_LEN);

const getKeyFromPassword = (password, salt) => {
    return crypto.scryptSync(password, salt, ALGORITHM.KEY_BYTE_LEN);
};

const encryptBuffer = (messagetext, key) => {
    const iv = getIV();
    const cipher = crypto.createCipheriv(
        ALGORITHM.BLOCK_CIPHER, key, iv,
        { 'authTagLength': ALGORITHM.AUTH_TAG_BYTE_LEN });
    let encryptedMessage = cipher.update(messagetext);
    encryptedMessage = Buffer.concat([encryptedMessage, cipher.final()]);

    return Buffer.concat([iv, encryptedMessage, cipher.getAuthTag()]);
};

const decryptBuffer = (ciphertext, key) => {
    const authTag = ciphertext.slice(-16);
    const iv = ciphertext.slice(0, 12);
    const encryptedMessage = ciphertext.slice(12, -16);
    const decipher = crypto.createDecipheriv(
        ALGORITHM.BLOCK_CIPHER, key, iv,
        { 'authTagLength': ALGORITHM.AUTH_TAG_BYTE_LEN });
    decipher.setAuthTag(authTag);
    let messagetext = decipher.update(encryptedMessage);
    messagetext = Buffer.concat([messagetext, decipher.final()]);

    return messagetext;
};

/**
 *
 * @param {*} userId
 * @param {*} password
 * @param {string} data
 * @returns
 */
function encrypt(userId, password, data) {
    return encryptBuffer(Buffer.from(data), getKeyFromPassword(password, userId));
}

/**
 *
 * @param {*} userId
 * @param {*} password
 * @param {Buffer} data
 * @returns
 */
function decrypt(userId, password, data) {
    return decryptBuffer(data, getKeyFromPassword(password, userId));
}

/**
 *
 * @returns
 */
function getAuthToken() {
    return crypto.randomBytes(256);
}

module.exports = {
    encrypt,
    decrypt,
    getAuthToken
};