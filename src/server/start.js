const fs = require('fs');
const axios = require('axios');
const exec = require('child_process').exec;
const logging = require('../logging/logging');

const { spawn } = require('child_process');
const { minecraftPath } = require('../../env');

const memory = 8;

/**
 *
 * @param {*} args
 * @returns
 */
function getJvmArgs(args) {
    const jvm_memory = args.jvm_memory > 2 && args.jvm_memory <= memory
        ? args.jvm_memory
        : 4;

    return [
        '-XX:+UseG1GC',
        `-Xmx${jvm_memory}G`,
        `-Xms${jvm_memory}G`,
        '-Dsun.rmi.dgc.server.gcInterval=2147483646',
        '-XX:+UnlockExperimentalVMOptions',
        '-XX:G1NewSizePercent=60',
        '-XX:G1ReservePercent=20',
        '-XX:MaxGCPauseMillis=50',
        '-XX:G1HeapRegionSize=32M'
    ];
}

const root = minecraftPath();

const getForgeURL = (mcVersion, forgeVersion) =>
    `https://maven.minecraftforge.net/net/minecraftforge/forge/${mcVersion}-${forgeVersion}/forge-${mcVersion}-${forgeVersion}-installer.jar`;

/**
 *
 * @param {*} mcVersion
 * @param {*} forgeVersion
 * @returns
 */
function downloadInstaller(mcVersion, forgeVersion) {
    logging.info('Downloading installer...');

    if (!fs.existsSync(root))
        fs.mkdirSync(root, { recursive: true });

    return new Promise((resolve, reject) => {
        const onReady = () => {
            resolve(true);
        };

        axios.get(getForgeURL(mcVersion, forgeVersion), { responseType: 'stream' })
            .then((response) => {
                const writer = fs.createWriteStream(root + '/installer.jar');

                writer.on('error', (err) => reject(err));

                writer.on('close', onReady);

                response.data.pipe(writer);
            })
            .catch((err) => {
                logging.error(err.message);
                reject(new Error('Failed to download forge installer.'));
            });
    });
}

/**
 *
 * @returns
 */
function runInstaller() {
    return new Promise((resolve, reject) => {
        exec(`cd ${root} && java -jar installer.jar --installServer`, { maxBuffer: 1024 * 1024 * 1024 }, (err) => {
            if (err)
                reject(err);
            else
                resolve(true);
        });
    });
}

/**
 *
 * @returns
 */
function modifyEula() {
    return new Promise((resolve, reject) => {
        fs.readFile(root + '/eula.txt', (err, data) => {
            if (err)
                reject(err);
            else {
                logging.info('#'.repeat(process.stdout.columns));
                logging.info('Updating EULA.');
                logging.info('#'.repeat(process.stdout.columns));

                fs.writeFile(root + '/eula.txt', data.toString().replace('=false', '=true'), (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve(true);
                });
            }
        });
    });
}

/**
 *
 * @param {*} mcVersion
 * @param {*} forgeVersion
 * @returns
 */
function renameForge(mcVersion, forgeVersion) {
    const forge = `${mcVersion}-${forgeVersion}`;

    return new Promise((resolve, reject) => {
        if (fs.existsSync(`${root}/forge-${forge}.jar`)) {
            exec(`mv ${root}/forge-${forge}.jar ${root}/forge.jar`, (err) => {
                if (err)
                    reject(err);
                else {
                    resolve(true);
                }
            });
        }
        else
            resolve(false);
    });
}

/**
 *
 * @returns {Promise<ChildProcessWithoutNullStreams>}
 */
function runServer(args) {
    logging.info('Starting server process.');

    if (fs.existsSync(root + '/forge.jar')) {
        return new Promise((resolve, reject) => {

            const ls = spawn('java', [...getJvmArgs(args), '-jar', 'forge.jar', 'nogui'], { cwd: root });

            ls.on('error', (err) => {
                logging.error(err);
                reject(err);
            });

            resolve(ls);
        });
    }

    return Promise.resolve(null);
}

/**
 * @param {import('./base').MinecraftServer} mcServer
 * @param {Object.<string, *>} args
 * @returns {Promise<ChildProcessWithoutNullStreams>}
 */
function start(mcServer, args) {
    if (mcServer.getStatus()) {
        logging.warnEmit(mcServer, 'Server is already running.');

        return Promise.reject(new Error('Server is already running.'));
    }

    logging.info('Starting:', root);

    if (!fs.existsSync(root))
        fs.mkdirSync(root, { recursive: true });

    if (args.install === undefined && fs.existsSync(root + '/forge.jar')) {
        return new Promise((resolve, reject) => {
            runServer(args)
                .then((ls) => {
                    if (ls !== null)
                        resolve(ls);
                    else
                        reject(new Error('Failed to start server.'));
                })
                .catch((err) => reject(err));
        });
    }

    logging.info('Forge jar does not exist. Downloading installer.');

    if (!args.version_minecraft || !args.version_forge)
        return Promise.reject(new Error('Missing install arguments.'));

    return new Promise((resolve, reject) => {
        const steps = [
            () => {
                logging.infoEmit(mcServer, 'Step 1 - run installer.');

                return runInstaller();
            },
            () => {
                logging.infoEmit(mcServer, 'Step 2 - updating folder structure.');

                return renameForge(args.version_minecraft, args.version_forge);
            },
            () => {
                logging.infoEmit(mcServer, 'Step 3 - generating initial server content.');

                if (fs.existsSync(root + '/eula.txt'))
                    return Promise.resolve(true);

                return new Promise((resolve, reject) => {
                    runServer({ jvm_memory: 2 })
                        .then((ls) => {
                            if (ls !== null) {
                                ls.on('close', () => {
                                    resolve(true);
                                });
                            }
                            else
                                resolve(false);
                        })
                        .catch((err) => reject(err));
                });
            },
            () => {
                logging.infoEmit(mcServer, 'Step 4 - updating EULA.');

                return modifyEula();
            },
            () => {
                logging.success(mcServer, 'Install complete!');
                resolve(null);
            }
        ];

        if (!fs.existsSync(`${root}/installer.jar`)) {
            logging.info('Installer does not exist. Downloading...');

            downloadInstaller(args.version_minecraft, args.version_forge)
                .then(() => steps[0]())
                .then(() => steps[1]())
                .then(() => steps[2]())
                .then(() => steps[3]())
                .then(() => steps[4]())
                .catch((err) => reject(err));
        }
        else {
            logging.info('Installer exists. Running...');

            steps[0]()
                .then(() => steps[1]())
                .then(() => steps[2]())
                .then(() => steps[3]())
                .then(() => steps[4]())
                .catch((err) => reject(err));
        }
    });
}

module.exports = start;