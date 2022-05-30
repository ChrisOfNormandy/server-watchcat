import { post } from '../../../helpers/net-handler';

/**
 *
 * @param {Object.<string, *>} jvmArgs
 * @param {function()} connect
 */
export default function restart(jvmArgs, connect) {
    post('/stop')
        .then(() => {
            console.debug('Using JVM:', jvmArgs);

            post('/start', jvmArgs)
                .then((response) => response.text())
                .then(() => setTimeout(connect, 1000))
                .catch((err) => console.error(err));
        })
        .catch((err) => console.error(err));
}