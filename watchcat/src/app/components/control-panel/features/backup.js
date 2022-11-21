import { post } from '../../../helpers/net-handler';

/**
 *
 */
export default function backup() {
    post('/backup')
        .then((response) => response.text())
        .then((data) => console.log(data))
        .catch((err) => console.error(err));
}