import { post } from '../../../helpers/net-handler';
import socketHandler from '../../../views/socketHandler';
/**
 *
 * @param {Object.<string, *>} profile
 */
export default function start(profile) {
    return new Promise((resolve, reject) => {
        post('/start', profile)
            .then((response) => response.text())
            .then(() => {
                setTimeout(() => {
                    resolve(socketHandler.connect());
                }, 1000);
            })
            .catch(reject);
    });
}