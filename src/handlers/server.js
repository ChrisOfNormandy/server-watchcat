const logging = require('../logging/logging');

const { getProfile } = require('./profiles');

module.exports = {
    /**
     *
     * @param {*} req
     * @param {*} res
     * @param {import('../server/base').MinecraftServer} mcServer
     */
    start(req, res, mcServer) {
        if (mcServer.getStatus()) {
            logging.infoEmit(mcServer, 'Server is already running.');
            res.send(false);
        }
        else {
            const fields = req.body;

            logging.debug('Fields:', fields);

            if (!fields.profile)
                res.send(new Error('No selected profile.'));
            else {
                getProfile(fields.profile)
                    .then((profile) => {
                        logging.info('Profile:', profile);
                        mcServer.start(profile)
                            .then((status) => {
                                if (status !== null)
                                    logging.success(mcServer, 'Server started!');
                                res.send(true);
                            })
                            .catch((err) => {
                                logging.errorEmit(mcServer, err.message);
                                res.send(err);
                            });
                    })
                    .catch((err) => {
                        logging.error(err);
                        res.send(err);
                    });
            }
        }
    },
    /**
     *
     * @param {*} req
     * @param {*} res
     * @param {import('../server/base').MinecraftServer} mcServer
     */
    stop(req, res, mcServer) {
        mcServer.kill()
            .then((r) => {
                logging.success(mcServer, 'Server stopped!');
                res.send(r);
            })
            .catch((err) => {
                logging.errorEmit(mcServer, err.message);
                res.send(err);
            });
    }
};