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
            .then(resolve)
            .catch(reject);
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
            .then(resolve)
            .catch(reject);
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
            .then(resolve)
            .catch(reject);
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
            .then(resolve)
            .catch(reject);
    });
}

/**
 *
 * @param {string} endpoint
 * @returns
 */
export function getData(endpoint) {
    return new Promise((resolve, reject) => {
        get(endpoint)
            .then((response) => response.json())
            .then(resolve)
            .catch(reject);
    });
}

export const getCookie = (name) => document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';

export { domain };