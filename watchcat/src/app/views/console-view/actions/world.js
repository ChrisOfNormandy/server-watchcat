import * as adapter from '../../../components/control-panel/adapter';

const server = adapter.default.features;

/**
 *
 * @param {*} e
 */
export function backup(e) {
    e.preventDefault();
    server.backup();
}