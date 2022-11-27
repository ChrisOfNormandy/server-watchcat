const fs = require('fs');
const axios = require('axios');
const exec = require('child_process').exec;
const logging = require('../logging/logging');

const { spawn } = require('child_process');
const { minecraftPath } = require('../../env');

const memory = 16;

/**
 *
 * @param {import('../../typedef').JVMArguments} args
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

/**
 * 
 * @param {string} mcVersion 
 * @param {string} forgeVersion 
 * @returns 
 */
const getForgeURL = (mcVersion, forgeVersion) =>
    `https://maven.minecraftforge.net/net/minecraftforge/forge/${mcVersion}-${forgeVersion}/forge-${mcVersion}-${forgeVersion}-installer.jar`;

/**
 *
 * @param {string} mcVersion
 * @param {string} forgeVersion
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
 * @param {*} profile 
 * @returns 
 */
function modifyUserJvmArgs(profile) {
    return new Promise((resolve, reject) => {
        fs.readFile(root + '/user_jvm_args.txt', (err, data) => {
            if (err)
                reject(err);
            else {
                logging.info('#'.repeat(process.stdout.columns));
                logging.info('Updating user JVM args.');
                logging.info('#'.repeat(process.stdout.columns));

                let str = data.toString()
                    .replace('# -Xmx4G', `-Xmx${profile.start.jvm.memory}G`);

                str += [
                    '\n-XX:+UnlockExperimentalVMOptions',
                    '-XX:+UseZGC'
                ].join('\n');

                fs.writeFile(root + '/user_jvm_args.txt', str, (err) => {
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
function renameForge(mcVersion, forgeVersion, jarName) {
    const forge = `${mcVersion}-${forgeVersion}`;

    return new Promise((resolve, reject) => {
        if (fs.existsSync(`${root}/forge-${forge}.jar`)) {
            exec(`mv ${root}/forge-${forge}.jar ${root}/${jarName}`, (err) => {
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
function runServer(profile) {
    const jar = root + '/' + profile.start.jar;

    if (fs.existsSync(jar)) {
        logging.info('Starting server process:', jar);

        return new Promise((resolve, reject) => {
            const ls = spawn('java', [...getJvmArgs(profile.start.jvm), '-jar', profile.start.jar, 'nogui'], { cwd: root });

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
 *
 * @param {*} profile
 * @returns
 */
function runServerScript(profile) {
    const script = root + '/run.sh';

    if (fs.existsSync(script)) {
        logging.info('Starting server process,', script);

        return new Promise((resolve, reject) => {
            logging.debug(script, ...getJvmArgs(profile.start.jvm), 'nogui');

            const ls = spawn(script, ['nogui'], { cwd: root });

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
 * @param {Object.<string, *>} profile
 * @returns {Promise<ChildProcessWithoutNullStreams>}
 */
function start(mcServer, profile) {
    if (mcServer.getStatus()) {
        logging.warnEmit(mcServer, 'Server is already running.');

        return Promise.reject(new Error('Server is already running.'));
    }

    logging.info('Starting:', root, profile.start.jar);

    if (!fs.existsSync(root))
        fs.mkdirSync(root, { recursive: true });

    if (fs.existsSync(root + '/eula.txt')) {
        if (fs.existsSync(root + '/' + profile.start.jar)) {
            return new Promise((resolve, reject) => {
                runServer(profile)
                    .then((ls) => {
                        if (ls !== null)
                            resolve(ls);
                        else
                            reject(new Error('Failed to start server.'));
                    })
                    .catch((err) => reject(err));
            });
        }
        else if (fs.existsSync(root + '/run.sh')) {
            return new Promise((resolve, reject) => {
                runServerScript(profile)
                    .then((ls) => {
                        if (ls !== null)
                            resolve(ls);
                        else
                            reject(new Error('Failed to start server.'));
                    })
                    .catch((err) => reject(err));
            });
        }
    }

    if (!profile.install.version_minecraft || !profile.install.version_forge)
        return Promise.reject(new Error('Missing install arguments.'));

    return new Promise((resolve, reject) => {
        const steps = [
            () => {
                logging.infoEmit(mcServer, 'Step 1 - run installer.');

                return runInstaller();
            },
            () => {
                logging.infoEmit(mcServer, 'Step 2 - updating folder structure.');
                mcServer.pushEmit('ftpupdate', '');

                return renameForge(profile.install.version_minecraft, profile.install.version_forge, profile.start.jar);
            },
            () => {
                logging.infoEmit(mcServer, 'Step 3 - generating initial server content.');
                mcServer.pushEmit('ftpupdate', '');

                return new Promise((resolve, reject) => {
                    if (
                        fs.existsSync(root + '/' + profile.start.jar) &&
                        !fs.existsSync(root + '/eula.txt')
                    ) {
                        runServer(profile)
                            .then((ls) => {
                                if (ls !== null) {
                                    logging.debug('Waiting for close...');

                                    ls.stdout.on('data', (data) => logging.debug(data.toString()));

                                    ls.on('close', () => {
                                        logging.debug('Closed');

                                        mcServer.pushEmit('ftpupdate', '');
                                        resolve(true);
                                    });
                                }
                                else {
                                    logging.warn('Result of running server jar was null.');
                                    resolve(false);
                                }
                            })
                            .catch((err) => reject(err));
                    }
                    else if (
                        fs.existsSync(root + '/run.sh') &&
                        (
                            !fs.existsSync(root + '/eula.txt') ||
                            !fs.existsSync(root + '/user_jvm_args.txt')
                        )
                    ) {
                        runServerScript(profile)
                            .then((ls) => {
                                if (ls !== null) {
                                    logging.debug('Waiting for close...');

                                    ls.stdout.on('data', (data) => logging.debug(data.toString()));

                                    ls.on('close', () => {
                                        logging.debug('Closed');

                                        mcServer.pushEmit('ftpupdate', '');
                                        resolve(true);
                                    });
                                }
                                else {
                                    logging.warn('Result of running server script was null.');
                                    resolve(false);
                                }
                            })
                            .catch((err) => reject(err));
                    }
                    else {
                        resolve(false);
                    }
                });
            },
            () => {
                if (fs.existsSync(root + '/eula.txt')) {
                    logging.infoEmit(mcServer, 'Step 4 - updating EULA.');

                    return modifyEula();
                }

                return Promise.reject(new Error('Failed to find EULA file.'));
            },
            () => {
                if (fs.existsSync(root + '/user_jvm_args.txt')) {
                    logging.infoEmit(mcServer, 'Step 5 - updating user JVM args.');

                    return modifyUserJvmArgs(profile);
                }

                return Promise.resolve(null);
            },
            () => {
                logging.success(mcServer, 'Install complete!');
                resolve(null);
            }
        ];

        if (!fs.existsSync(`${root}/installer.jar`)) {
            logging.info('Installer does not exist. Downloading...');

            downloadInstaller(profile.install.version_minecraft, profile.install.version_forge)
                .then(() => steps[0]())
                .then(() => steps[1]())
                .then(() => steps[2]())
                .then(() => steps[3]())
                .then(() => steps[4]())
                .then(() => steps[5]())
                .catch((err) => reject(err));
        }
        else {
            logging.info('Installer exists. Running...');

            steps[0]()
                .then(() => steps[1]())
                .then(() => steps[2]())
                .then(() => steps[3]())
                .then(() => steps[4]())
                .then(() => steps[5]())
                .catch((err) => reject(err));
        }
    });
}

module.exports = start;