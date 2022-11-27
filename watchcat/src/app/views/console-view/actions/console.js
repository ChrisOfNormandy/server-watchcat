import socketHandler from '../../../helpers/socketHandler';

/**
 *
 * @param {*} e
 */
export function reconnect(e) {
    e.preventDefault();
    socketHandler.connect();
}