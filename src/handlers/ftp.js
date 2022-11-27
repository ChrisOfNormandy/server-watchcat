const fs = require('fs');
const path = require('path');
const zip = require('./zip');
const cookies = require('./cookies');
const logging = require('../logging/logging');

const { validSession } = require('./auth');
const { minecraftPath, getUserById, noValidate } = require('../../env');
const { mcServer } = require('../server');

const root = minecraftPath();

const mimeTypes = {
    '.toml': 'application/toml'
};

/**
 *
 * @param {*} req
 * @returns
 */
function validate(req) {
    if (noValidate)
        return true;

    const { user, session } = cookies.getAll(req);

    if (!user || !session)
        return false;

    return validSession(user, session);
}

module.exports = {
    upload: {
        /**
         *
         * @param {import('express').Request} req
         * @param {import('express').Response} res
         */
        file(req, res) {
            if (validate(req)) {
                const username = getUserById(cookies.getAll(req).user);

                const dir = req.params.dir.replace(/\*/g, '/');

                const p = dir === 'home'
                    ? root
                    : `${root}/${dir.replace(/\*/g, '/')}`;

                const dirPath = path.dirname(`${p}/${req.file.originalname}`);

                if (!fs.existsSync(dirPath))
                    fs.mkdirSync(dirPath, { recursive: true });

                fs.writeFile(`${p}/${req.file.originalname}`, req.file.buffer, (err) => {
                    if (err) {
                        logging.error(err);
                        res.send(err);
                    }
                    else {
                        logging.debug(`Uploaded file [${req.file.originalname}] to:`, dir);
                        logging.audit(username, `uploaded file [${req.file.originalname}] to:`, dir);

                        mcServer.pushEmit('ftpupdate', '');

                        res.send(true);
                    }
                });
            }
            else
                res.send(false);
        }
    },
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    fetch(req, res) {
        if (validate(req)) {
            const dir = req.params.dir.replace(/\*/g, '/');

            logging.debug('Getdir:', dir);

            if (dir === 'home') {
                fs.readdir(root, (err, files) => {
                    if (err) {
                        logging.error(err);
                        res.send(err);
                    }
                    else {
                        res.send(files.map((file) => {
                            const stats = fs.statSync(root + '/' + file);

                            return {
                                name: file,
                                size: stats.size
                            };
                        }));
                    }
                });
            }
            else {
                fs.readdir(`${root}/${dir}`, (err, files) => {
                    if (err) {
                        logging.error(err);
                        res.send(err);
                    }
                    else
                        res.send(files.map((file) => {
                            const stats = fs.statSync(`${root}/${dir}/${file}`);

                            return {
                                name: file,
                                size: stats.size
                            };
                        }));
                });
            }
        }
        else
            res.send('[]');
    },
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    run(req, res) {
        if (validate(req)) {
            const username = getUserById(cookies.getAll(req).user);

            const { action, dir } = req.params;

            const target = dir.replace(/\*/g, '/');
            const p = `${root}/${target}`;

            logging.debug('File:', action, p);

            switch (action) {
                case 'delete': {
                    fs.rm(p, (err) => {
                        if (err) {
                            logging.error(err);
                            res.send(err);
                        }
                        else {
                            logging.audit(username, 'deleted file:', target);
                            mcServer.pushEmit('ftpupdate', '');

                            res.send(true);
                        }
                    });
                    break;
                }
                case 'delete-dir': {
                    fs.rm(p, { recursive: true }, (err) => {
                        if (err) {
                            logging.error(err);
                            res.send(err);
                        }
                        else {
                            logging.audit(username, 'deleted folder:', target);
                            mcServer.pushEmit('ftpupdate', '');

                            res.send(true);
                        }
                    });
                    break;
                }
                case 'create-dir': {
                    fs.mkdir(p, { recursive: true }, (err) => {
                        if (err) {
                            logging.error(err);
                            res.send(err);
                        }
                        else {
                            logging.audit(username, 'created folder:', target);
                            mcServer.pushEmit('ftpupdate', '');

                            res.send(true);
                        }
                    });
                    break;
                }
                case 'rename': {
                    if (!fs.existsSync(p)) {
                        logging.debug('File not found:', dir);
                        res.send(new Error('File not found.'));
                        break;
                    }
                    else {
                        fs.rename(p, `${root}/${req.body.filename}`, (err) => {
                            if (err) {
                                logging.error(err);
                                res.send(err);
                            }
                            else {
                                logging.audit(username, 'renamed file:', target, 'to:', `${root}/${req.body.filename}`);
                                mcServer.pushEmit('ftpupdate', '');

                                res.send(true);
                            }
                        });
                        break;
                    }
                }
                case 'rename-dir': {
                    if (!fs.existsSync(p)) {
                        logging.debug('Folder not found:', dir);
                        res.send(new Error('Folder not found.'));
                        break;
                    }
                    else {
                        fs.rename(p, `${root}/${req.body.filename}`, (err) => {
                            if (err) {
                                logging.error(err);
                                res.send(err);
                            }
                            else {
                                logging.audit(username, 'renamed folder:', target, 'to:', req.body.filename);
                                mcServer.pushEmit('ftpupdate', '');

                                res.send(true);
                            }
                        });
                        break;
                    }
                }
                case 'get': {
                    if (!fs.existsSync(p)) {
                        logging.debug('File not found:', p);
                        res.send(new Error('File not found.'));
                        break;
                    }
                    else {
                        const ext = path.extname(p);
                        if (mimeTypes[ext] !== undefined)
                            res.setHeader('Content-Type', mimeTypes[ext]);

                        res.sendFile(p);
                        break;
                    }
                }
                case 'zip': {
                    if (!fs.existsSync(p) || path.extname(p)) {
                        logging.debug('Folder not found or path is not a folder:', p);
                        res.send(new Error('Folder not found or path is not a folder.'));
                        break;
                    }
                    else {
                        logging.debug('Zipping:', p);

                        const archive = p.split('/').slice(-1);

                        zip(p)
                            .then((buffer) => {
                                logging.debug('Zipped:', archive.join('/'));

                                res.setHeader('Content-Type', 'application/zip');
                                res.setHeader('Content-Disposition', `attachment; filename=${archive.join('/')}.zip`);
                                res.write(buffer, 'binary');
                                res.end(undefined, 'binary');
                            })
                            .catch((err) => {
                                logging.error(err);
                                res.send(err);
                            });

                        break;
                    }
                }
                default: {
                    res.send(null);
                    break;
                }
            }
        }
        else
            res.send(false);
    }
};