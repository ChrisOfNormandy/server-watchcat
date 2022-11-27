const os = require('os');
const fs = require('fs');
const logging = require('./src/logging/logging');
require('dotenv')
    .config({ path: __dirname + '/.env' });

const home = os.homedir();

const ex = {
    port: process.env.WEB_PORT,
    web: __dirname + process.env.WEB_PATH,
    datapath: home + '/.watchcat',
    logpath: home + '/.watchcat/logs',
    users: home + '/.watchcat/users',
    server_profiles: home + '/.watchcat/server_profiles',
    whiteboard: home + '/.watchcat/whiteboard',

    twoFA: process.env.TWOFA_NAME,
    minecraft: process.env.SERVER_PATH,
    noValidate: process.env.NO_VALIDATE,

    /**
     * 
     * @param {string} user 
     * @returns 
     */
    userPath(user) {
        return `${ex.users}/${user}.user`;
    },

    /**
     * 
     * @param {string} user 
     * @returns 
     */
    userIsCached(user) {
        if (!fs.existsSync(ex.datapath + '/users.json'))
            fs.writeFileSync(ex.datapath + '/users.json', '{}', 'utf-8');

        return new Promise((resolve, reject) => {
            fs.readFile(ex.datapath + '/users.json', 'utf-8', (err, data) => {
                if (err)
                    reject(err);
                else
                    resolve(JSON.parse(data)[user]);
            });
        });
    },

    /**
     * 
     * @param {string} id 
     * @returns 
     */
    getUserById(id) {
        if (!fs.existsSync(ex.datapath + '/users.json'))
            return id;

        const data = fs.readFileSync(ex.datapath + '/users.json', 'utf-8');

        const users = JSON.parse(data);

        for (let name in users) {
            if (users[name].id === id)
                return name;
        }

        return id;
    },

    /**
     * 
     * @param {string} id 
     * @returns 
     */
    getUserDataById(id) {
        if (!fs.existsSync(ex.datapath + '/users.json'))
            return null;

        const data = fs.readFileSync(ex.datapath + '/users.json', 'utf-8');

        const users = JSON.parse(data);

        for (let name in users) {
            if (users[name].id === id)
                return users[name];
        }

        return null;
    },

    /**
     * 
     * @param {string} user 
     * @param {{id: string, username: string, discriminator: string, tag: *, avatarURL: string}} data 
     * @returns 
     */
    cacheUser(user, data) {
        logging.debug('Cache user:', user, data);

        if (!fs.existsSync(ex.datapath + '/users.json'))
            fs.writeFileSync(ex.datapath + '/users.json', '{}', 'utf-8');

        return new Promise((resolve, reject) => {
            fs.readFile(ex.datapath + '/users.json', 'utf-8', (err, original) => {
                if (err) {
                    if (err.code === 'ENOENT')
                        fs.writeFile(ex.datapath + '/users.json', '{}', (err) => {
                            if (err)
                                reject(err);
                            else {
                                ex.cacheUser(user, data)
                                    .then((r) => resolve(r))
                                    .catch((err) => reject(err));
                            }
                        });
                    else
                        reject(err);
                }
                else {
                    const json = JSON.parse(original);

                    json[user] = {
                        id: data.id,
                        username: data.username,
                        discriminator: data.discriminator,
                        tag: data.tag,
                        avatarURL: data.avatarURL
                    };

                    fs.writeFile(ex.datapath + '/users.json', JSON.stringify(json, null, 4), (err) => {
                        if (err)
                            reject(err);
                        else
                            resolve(json);
                    });
                }
            });
        });
    },

    /**
     * 
     * @param {string} user 
     * @returns 
     */
    sessionPath(user) {
        return `${ex.users}/${user}.session`;
    },

    /**
     * 
     * @param {string} profile 
     * @returns 
     */
    minecraftPath(profile) {
        return `${os.homedir}/${ex.minecraft}/${profile}`;
    },

    /**
     * 
     * @returns 
     */
    loginPath() {
        return fs.existsSync(ex.web)
            ? ex.web + '/login.html'
            : __dirname + '/watchcat/build/login.html';
    },

    /**
     * 
     * @param {string} file 
     * @returns 
     */
    logPath(file) {
        return ex.logPath + '/' + file;
    },

    /**
     * 
     * @returns 
     */
    webPath() {
        return fs.existsSync(ex.web)
            ? ex.web
            : __dirname + '/watchcat/build';
    },

    /**
     * 
     * @returns 
     */
    homePath() {
        return fs.existsSync(ex.web)
            ? ex.web + '/index.html'
            : __dirname + '/watchcat/build/index.html';
    },

    /**
     * 
     * @param {string} file 
     * @returns 
     */
    staticFile(file) {
        return fs.existsSync(ex.web)
            ? ex.web + '/' + file
            : __dirname + '/watchcat/build/' + file;
    }
};

module.exports = ex;