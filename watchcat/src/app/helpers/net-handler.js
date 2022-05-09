const domain = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : '';

/**
 *
 * @param {string} endpoint
 * @returns {Promise<Response>}
 */
export function post(endpoint, body = {}) {
    return new Promise((resolve, reject) => {
        fetch(domain + endpoint, {
            method: 'POST', body: typeof body === 'string'
                ? body
                : JSON.stringify(body), headers: { 'Content-Type': 'application/json' }
        })
            .then((response) => resolve(response))
            .catch((err) => reject(err));
    });
}

/**
 *
 * @param {string} endpoint
 * @param {File} file
 * @returns {Promise<Response>}
 */
export function sendFile(endpoint, file) {
    return new Promise((resolve, reject) => {
        fetch(domain + endpoint, {
            method: 'POST', body: file, headers: { 'Content-Type': file.type }
        })
            .then((response) => resolve(response))
            .catch((err) => reject(err));
    });
}

/**
 *
 * @param {*} endpoint
 * @param {*} file
 * @returns
 */
export function sendForm(endpoint, file) {
    const form = new FormData();
    form.append('file', file, file.name);

    return new Promise((resolve, reject) => {
        fetch(domain + endpoint, {
            method: 'POST', body: form
        })
            .then((response) => resolve(response))
            .catch((err) => reject(err));
    });
}

/**
 *
 * @param {string} endpoint
 * @returns {Promise<Response>}
 */
export function get(endpoint) {
    return new Promise((resolve, reject) => {
        fetch(domain + endpoint, { method: 'GET' })
            .then((response) => resolve(response))
            .catch((err) => reject(err));
    });
}

export { domain };