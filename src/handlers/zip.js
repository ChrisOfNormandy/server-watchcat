const fs = require('fs');
const JSZip = require('jszip');

/**
 *
 * @param {string} path
 */
function zip(path) {
    const zip = new JSZip();

    const recur = (root, p) => {
        const step = (file) => root + '/' + file;
        const relPath = (file) => p + '/' + file;

        const iterate = (file) => {
            if (fs.lstatSync(step(file)).isDirectory())
                return recur(step(file), relPath(file));

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

    return new Promise((resolve, reject) => {
        const archive = path.split('/').slice(-1);

        recur(path, archive)
            .then((zip) => {
                zip.generateAsync({ type: 'nodebuffer' })
                    .then(resolve)
                    .catch(reject);
            })
            .catch(reject);
    });
}

module.exports = zip;