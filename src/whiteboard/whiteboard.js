const fs = require('fs');
const env = require('../../env');
const logging = require('../logging/logging');
const { mcServer } = require('../server');

/**
 *
 * @returns
 */
function getDrawData() {
    if (!fs.existsSync(env.whiteboard))
        fs.mkdirSync(env.whiteboard);

    if (!fs.existsSync(env.whiteboard + '/draw_data.json'))
        fs.writeFileSync(env.whiteboard + '/draw_data.json', '{}', 'utf-8');

    return new Promise((resolve, reject) => {
        fs.readFile(env.whiteboard + '/draw_data.json', (err, data) => {
            if (err)
                reject(err);
            else {
                let str = data.toString();
                try {
                    let json = JSON.parse(str);
                    resolve(json);
                }
                catch (err) {
                    logging.error(err);
                    resolve({});
                }
            }
        });
    });
}

/**
 *
 * @param {*} data
 * @returns
 */
function setDrawData(data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(env.whiteboard + '/draw_data.json', JSON.stringify(data), 'utf-8', (err) => {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
}

/**
 *
 * @param {*} elem
 * @returns
 */
function addElement(elem) {
    logging.debug('ELEMENT:', elem);

    return new Promise((resolve, reject) => {
        getDrawData()
            .then((data) => {
                let toWrite = data || {};

                toWrite[elem.id] = elem.data;

                setDrawData(toWrite)
                    .then(() => resolve(elem))
                    .catch(reject);
            })
            .catch(reject);
    });
}

/**
 *
 * @param {*} elem
 * @returns
 */
function removeElement(elem) {
    logging.debug('ELEMENT:', elem);

    return new Promise((resolve, reject) => {
        getDrawData()
            .then((data) => {
                if (!data[elem.id])
                    reject(new Error(`Element does not exist: ${elem.id}`));
                else {
                    let toWrite = data || {};

                    delete toWrite[elem.id];

                    console.debug('DELETED');

                    setDrawData(toWrite)
                        .then(() => resolve(elem))
                        .catch(reject);
                }
            })
            .catch(reject);
    });
}

/**
 *
 * @param {*} buffer
 * @returns
 */
function addElementHandler(buffer) {
    logging.debug('Add Element Handler');

    if (!buffer)
        return logging.debug('No data');

    try {
        const json = JSON.parse(Buffer.from(buffer).toString());

        if (json.remove) {
            logging.debug('REMOVE:', json);
            removeElement(json)
                .then((data) => mcServer.pushEmit('whiteboard_update', JSON.stringify(data)))
                .catch(logging.error);
        }
        else {
            addElement(json)
                .then((data) => mcServer.pushEmit('whiteboard_update', JSON.stringify(data)))
                .catch(logging.error);
        }
    }
    catch (err) {
        logging.error(err);
    }
}

/**
 *
 * @param {*} buffer
 * @returns
 */
function updateTracking(buffer) {
    if (!buffer)
        return logging.debug('No data');

    try {
        const elem = JSON.parse(Buffer.from(buffer).toString());

        const connection = mcServer.connections.get(elem.id);
        connection.whiteboard.position = elem.position;
        connection.whiteboard.rawPosition = elem.rawPosition;

        const tracking = {
            users: []
        };

        mcServer.connections.forEach((con) => {
            tracking.users.push(
                {
                    id: con.socket.id,
                    user: elem.user,
                    position: con.whiteboard.position,
                    rawPosition: con.whiteboard.rawPosition
                }
            );
        });

        if (tracking.users.length)
            mcServer.pushEmit('whiteboard_tracking', JSON.stringify(tracking));
    }
    catch (err) {
        logging.error(err);
    }
}

module.exports = {
    addElementHandler,
    getDrawData,
    updateTracking
};