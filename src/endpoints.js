const upload = require('multer')();
const ftp = require('./handlers/ftp');
const auth = require('./handlers/auth');
const server = require('./handlers/server');
const logging = require('./logging/logging');
const routing = require('./handlers/routing');
const profiles = require('./handlers/profiles');

const { exec } = require('child_process');
const { mcServer } = require('./server');
const { readFile, existsSync, mkdirSync, writeFile } = require('fs');
const { web, minecraftPath } = require('../env');
const zip = require('./handlers/zip');

/**
 *
 * @param {*} _
 * @param {*} res
 */
function status(_, res) {
    logging.infoEmit(mcServer, 'Running:', mcServer.getStatus());
    res.send(mcServer.getStatus());
}

/**
 *
 * @param {*} _
 * @param {*} res
 */
function backup(_, res) {
    const path = minecraftPath();

    if (!existsSync(path + '/backups'))
        mkdirSync(path + '/backups', { recursive: true });

    const backupName = `world_${new Date().toISOString().replace('T', '_').replace(/:/g, '-').split('.')[0]}`;

    zip(path + '/world')
        .then((buffer) => {
            writeFile(path + '/backups/' + backupName + '.zip', buffer, 'binary', (err) => {
                if (err) {
                    logging.error(err);
                    res.send(false);
                }
                else {
                    logging.info('Zipped backup as:', backupName);
                    res.send(true);
                }
            });
        })
        .catch((err) => {
            logging.error(err);
            res.send(false);
        });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function send(req, res) {
    if (mcServer.getStatus())
        res.send(mcServer.send(`${req.body.message}`));
    else
        res.send(false);
}

/**
 *
 * @param {string} file
 * @returns
 */
function getDocumentation(file) {
    return __dirname + '/documentation/' + file;
}

/**
 *
 * @param {*} _
 * @param {*} res
 */
function getLoginSplash(_, res) {
    readFile(getDocumentation('wall-of-text.txt'), (err, data) => {
        if (err) {
            logging.error(err);
            res.send('');
        }
        else
            res.send(data);
    });
}

/**
 *
 * @param {*} _
 * @param {*} res
 */
function reset(_, res) {
    exec('pkill java', (err, stdout) => {
        if (err)
            logging.error(err);
        else {
            logging.info(stdout);
        }

        res.send(null);
    });
}

const post = [
    {
        path: '/auth/register',
        fn: auth.register
    },
    {
        path: '/auth/generate',
        fn: auth.generate
    },
    {
        path: '/auth/validate',
        fn: auth.validate
    },
    {
        path: '/start',
        fn: (req, res) => server.start(req, res, mcServer)
    },
    {
        path: '/stop',
        fn: (req, res) => server.stop(req, res, mcServer)
    },
    {
        path: '/backup',
        fn: backup
    },
    {
        path: '/send',
        fn: send
    },
    {
        path: '/upload/:dir',
        options: upload.single('file'),
        fn: ftp.upload.file
    },
    {
        path: '/files/:action/:dir',
        fn: ftp.run
    },
    {
        path: '/login',
        fn: (req, res) => auth.login(req, res, routing.goHome)
    },
    {
        path: '/reset',
        fn: reset
    },
    {
        path: '/profiles/create',
        fn: profiles.createProfile
    },
    {
        path: '/profiles/delete',
        fn: profiles.deleteProfile
    }
];

const get = [
    {
        path: '/status',
        fn: status
    },
    {
        path: '/history',
        fn: (_, res) => res.send(mcServer.history)
    },
    {
        path: '/files/:dir',
        fn: ftp.fetch
    },
    {
        path: '/wall-of-text',
        fn: getLoginSplash
    },
    {
        path: '/status',
        fn: (req, res) => res.send(mcServer.getStatus())
    },
    {
        path: '/',
        fn: routing.index
    },
    {
        path: '/feature-flags.json',
        fn: (req, res) => res.sendFile(web + '/feature-flags.json')
    },
    {
        path: '/profiles/list',
        fn: profiles.listProfiles
    }
];

module.exports = {
    post,
    get
};