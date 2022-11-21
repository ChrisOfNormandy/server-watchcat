import { post } from '../../../helpers/net-handler';

/**
 *
 */
export default function stop() {
    return new Promise((resolve, reject) => {
        post('/stop')
            .then((response) => response.text())
            .then(resolve)
            .catch(reject);
    });
}