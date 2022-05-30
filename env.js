const os = require('os');
const fs = require('fs');
require('dotenv')
    .config({ path: __dirname + '/.env' });

const ex = {
    port: process.env.WEB_PORT,
    web: __dirname + process.env.WEB_PATH,
    datapath: os.homedir + '/.watchcat',
    users: os.homedir + '/.watchcat/users',
    server_profiles: os.homedir + '/.watchcat/server_profiles',
    twoFA: process.env.TWOFA_NAME,
    minecraft: process.env.SERVER_PATH,
    noValidate: process.env.NO_VALIDATE,

    userPath(user) {
        return `${ex.users}/${user}.user`;
    },
    userIsCached(user) {
        return new Promise((resolve, reject) => {
            fs.readFile(ex.datapath + '/users.json', 'utf-8', (err, data) => {
                if (err)
                    reject(err);
                else
                    resolve(JSON.parse(data)[user]);
            });
        });
    },
    getUserById(id) {
        if (!fs.existsSync(ex.datapath + '/users.json'))
            return id;

        const data = fs.readFileSync(ex.datapath + '/users.json', 'utf-8');

        const users = JSON.parse(data);

        for (let name in users) {
            if (users[name] === id) {
                return name;
            }
        }

        return id;
    },
    cacheUser(user, id) {
        return new Promise((resolve, reject) => {
            fs.readFile(ex.datapath + '/users.json', 'utf-8', (err, original) => {
                if (err) {
                    if (err.code === 'ENOENT')
                        fs.writeFile(ex.datapath + '/users.json', '{}', (err) => {
                            if (err)
                                reject(err);
                            else {
                                ex.cacheUser(user, id)
                                    .then((r) => resolve(r))
                                    .catch((err) => reject(err));
                            }
                        });
                    else
                        reject(err);
                }
                else {
                    const json = JSON.parse(original);
                    json[user] = { id };

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
    sessionPath(user) {
        return `${ex.users}/${user}.session`;
    },
    minecraftPath() {
        return `${os.homedir}/${ex.minecraft}`;
    },
    loginPath() {
        return fs.existsSync(ex.web)
            ? ex.web + '/login.html'
            : __dirname + '/watchcat/build/login.html';
    },
    homePath() {
        return fs.existsSync(ex.web)
            ? ex.web + '/index.html'
            : __dirname + '/watchcat/build/index.html';
    }
};

module.exports = ex;