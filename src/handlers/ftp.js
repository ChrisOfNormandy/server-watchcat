const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { minecraftPath } = require('../../env');
const logging = require('../logging/logging');

const root = minecraftPath();

const mimeTypes = {
    '.toml': 'application/toml'
};

module.exports = {
    upload: {
        file(req, res) {
            const dir = req.params.dir.replace(/\*/g, '/');

            const p = dir === 'home'
                ? root
                : `${root}/${dir.replace(/\*/g, '/')}`;

            fs.writeFile(`${p}/${req.file.originalname}`, req.file.buffer, (err) => {
                if (err) {
                    logging.error(err);
                    res.send(err);
                }
                else {
                    logging.debug('Uploaded file to:', dir);
                    res.send(true);
                }
            });
        }
    },
    fetch(req, res) {
        const dir = req.params.dir.replace(/\*/g, '/');

        logging.debug('Getdir:', dir);

        if (dir === 'home') {
            fs.readdir(root, (err, files) => {
                if (err) {
                    logging.error(err);
                    res.send(err);
                }
                else
                    res.send(files);
            });
        }
        else {
            fs.readdir(`${root}/${dir}`, (err, files) => {
                if (err) {
                    logging.error(err);
                    res.send(err);
                }
                else
                    res.send(files);
            });
        }
    },
    /**
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     */
    run(req, res) {
        const { action, dir } = req.params;

        const p = `${root}/${dir.replace(/\*/g, '/')}`;

        logging.debug('File:', action, p);

        switch (action) {
            case 'delete': {
                fs.rm(p, (err) => {
                    if (err) {
                        logging.error(err);
                        res.send(err);
                    }
                    else {
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
                    else
                        res.send(true);
                });
                break;
            }
            case 'create-dir': {
                fs.mkdir(p, { recursive: true }, (err) => {
                    if (err) {
                        logging.error(err);
                        res.send(err);
                    }
                    else
                        res.send(true);
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
                        else
                            res.send(true);
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
                        else
                            res.send(true);
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

                    const zip = new JSZip();

                    const recur = (root, p) => {
                        logging.debug('Stepping into:', root);

                        const step = (file) => root + '/' + file;
                        const relPath = (file) => p + '/' + file;

                        const iterate = (file) => {
                            if (fs.lstatSync(step(file)).isDirectory())
                                return recur(step(file), relPath(file));

                            logging.debug('Adding file:', step(file));

                            return new Promise((resolve, reject) => {
                                fs.readFile(step(file), (err, data) => {
                                    if (err)
                                        reject(err);
                                    else {
                                        zip.file(relPath(file), data);
                                        resolve(true);
                                    }
                                });
                            });
                        };

                        return new Promise((resolve, reject) => {
                            fs.readdir(root, (err, files) => {
                                if (err)
                                    reject(err);
                                else if (files.length) {
                                    Promise.all(files.map(iterate))
                                        .then(() => resolve(zip))
                                        .catch(reject);
                                }
                                else
                                    resolve(zip);
                            });
                        });
                    };

                    const archive = p.split('/').slice(-1);

                    recur(p, archive)
                        .then((zip) => {
                            zip.generateAsync({ type: 'nodebuffer' })
                                .then((buffer) => {
                                    logging.debug('Zipped:', buffer);

                                    res.setHeader('Content-Type', 'application/zip');
                                    res.setHeader('Content-Disposition', `attachment; filename=${archive}.zip`);
                                    res.write(buffer, 'binary');
                                    res.end(undefined, 'binary');
                                })
                                .catch((err) => {
                                    logging.error(err);
                                    res.send(err);
                                });
                        })
                        .catch((err) => {
                            logging.error(err);
                            res.send(err);
                        });
                    //
                    break;
                }
            }
            default: {
                res.send(null);
                break;
            }
        }
    }
};