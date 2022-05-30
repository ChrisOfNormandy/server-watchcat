const fs = require('fs');
const logging = require('../logging/logging');

const { server_profiles } = require('../../env');
const path = require('path');

/**
 *
 */
function init() {
    if (!fs.existsSync(server_profiles)) {
        fs.mkdir(server_profiles, { recursive: true }, (err) => {
            if (err)
                logging.error(err);
        });
    }
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function listProfiles(req, res) {
    fs.readdir(server_profiles, (err, files) => {
        if (err) {
            logging.error(err);
            res.send('[]');
        }
        else
            res.send(JSON.stringify(files.map((file) => path.basename(file).replace(path.extname(file), ''))));
    });
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function createProfile(req, res) {
    const profileFields = req.body;

    console.log(profileFields);

    if (fs.existsSync(server_profiles + '/' + profileFields.server_profile_name + '.profile'))
        res.send(null);
    else {
        const profile = {
            name: profileFields.server_profile_name,
            start: {
                jar: profileFields.server_profile_jar_name,
                jvm: {
                    memory: profileFields.server_profile_jvm_memory
                }
            },
            install: {
                version_minecraft: profileFields.version_minecraft,
                version_forge: profileFields.version_forge
            }
        };

        fs.writeFile(
            server_profiles + '/' + profile.name + '.profile',
            JSON.stringify(profile, null, 4),
            'utf-8',
            (err) => {
                if (err) {
                    logging.error(err);
                    res.send(err);
                }
                else {
                    logging.info('Created server profile:', profile.name);
                    res.send(profile);
                }
            }
        );
    }
}

/**
 *
 * @param {*} req
 * @param {*} res
 */
function deleteProfile(req, res) {
    const profileFields = req.body;

    console.log(profileFields);

    if (fs.existsSync(server_profiles + '/' + profileFields.profile + '.profile')) {
        fs.rm(server_profiles + '/' + profileFields.profile + '.profile', (err) => {
            if (err) {
                logging.error(err);
                res.send(err);
            }
            else
                res.send(true);
        });
    }
    else
        res.send(false);
}

/**
 *
 * @param {*} profile
 */
function getProfile(profile) {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(server_profiles + '/' + profile + '.profile')) {
            fs.readFile(server_profiles + '/' + profile + '.profile', (err, data) => {
                if (err) {
                    reject(err);
                }
                else
                    resolve(JSON.parse(data.toString()));
            });
        }
        else
            reject(new Error('Profile does not exist.'));
    });
}

module.exports = {
    init,
    listProfiles,
    getProfile,
    createProfile,
    deleteProfile
};