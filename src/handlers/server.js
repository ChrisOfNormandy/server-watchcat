const logging = require('../logging/logging');

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
            const jvmArgs = req.body;

            if (jvmArgs) {
                mcServer.start(jvmArgs)
                    .then((status) => {
                        if (status !== null)
                            logging.success(mcServer, 'Server started!');
                        res.send(true);
                    })
                    .catch((err) => {
                        logging.errorEmit(mcServer, err.message);
                        res.send(err);
                    });
            }
            else
                res.send(new Error('No JVM arguments.'));
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