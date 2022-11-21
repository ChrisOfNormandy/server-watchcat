import stop from './stop';
import start from './start';

/**
 *
 * @param {Object.<string, *>} profile
 * @returns
 */
export default function restart(profile) {
    return new Promise((resolve, reject) => {
        stop()
            .then(() => {
                start(profile)
                    .then(resolve)
                    .catch(reject);
            })
            .catch(reject);
    });
}