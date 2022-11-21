import toasts from '../../../helpers/toasts';

import { post } from '../../../helpers/net-handler';

/**
 *
 * @param {Object.<string, *>} installArgs
 * @param {function()} connect
 * @returns
 */
export default function install(fields, connect) {
    if (!fields.profile)
        return toasts.error('Missing profile.');

    fields.install = true;

    post('/start', fields)
        .then((response) => response.text())
        .then(() => setTimeout(connect, 1000))
        .catch((err) => console.error(err));
}