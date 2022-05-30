import { post } from '../../../helpers/net-handler';

/**
 *
 * @param {Object.<string, *>} profile
 * @param {function()} connect
 */
export default function start(profile, connect) {
    post('/start', profile)
        .then((response) => response.text())
        .then(() => setTimeout(connect, 1000))
        .catch((err) => console.error(err));
}