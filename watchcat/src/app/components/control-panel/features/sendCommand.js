import { post } from '../../../helpers/net-handler';

/**
 *
 * @param {string} message
 */
export default function sendCommand(message) {
    post('/send', { message })
        .then((response) => response.text())
        .then((data) => console.log(data))
        .catch((err) => console.error(err));
}