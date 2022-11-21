import { get } from '../../../helpers/net-handler';

/**
 *
 */
export default function status() {
    get('/status')
        .then((response) => response.text())
        .then((data) => console.log(data))
        .catch((err) => console.error(err));
}