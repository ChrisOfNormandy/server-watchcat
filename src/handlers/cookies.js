/**
 *
 * @param {*} req
 * @returns {Object.<string, string>}
 */
function getAll(req) {
    const cookies = {};

    if (!req.headers.cookie)
        return cookies;

    req.headers.cookie.split(/;\s*/).forEach((cookie) => {
        const v = cookie.split('=');
        cookies[v[0]] = v[1];
    });

    return cookies;
}

const cookies = {
    getAll
};

module.exports = cookies;