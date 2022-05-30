import { post } from '../../../helpers/net-handler';

/**
 *
 */
export default function stop() {
    post('/stop')
        .then((response) => response.text())
        .then((data) => console.log(data))
        .catch((err) => console.error(err));
}