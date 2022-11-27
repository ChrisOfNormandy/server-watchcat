const fs = require('fs');
const path = require('path');
const logging = require('../logging/logging');

const { server_profiles } = require('../../env');

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
 * @param {import('express').Request} req
 * @param {import('express').Response} res
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
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function createProfile(req, res) {
    const profileFields = req.body;

    if (!profileFields || !profileFields.server_profile_name)
        return res.send(null);

    if (fs.existsSync(server_profiles + '/' + profileFields.server_profile_name + '.profile'))
        return res.send(null);

    /**
     * @type {import('../../typedef').Profile}
     */
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

/**
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function deleteProfile(req, res) {
    const profileFields = req.body;

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
 * @param {string} profile 
 * @returns {Promise<import('../../typedef').Profile>}
 */
function getProfile(profile) {
    if (/[^-\w.()]/.test(profile))
        return Promise.reject(new Error('Invalid profile name.'))

    return new Promise((resolve, reject) => {
        if (fs.existsSync(server_profiles + '/' + profile + '.profile')) {
            fs.readFile(server_profiles + '/' + profile + '.profile', (err, data) => {
                if (err)
                    reject(err);
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