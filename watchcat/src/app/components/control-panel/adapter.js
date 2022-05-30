import backup from './features/backup';
import install from './features/install';
import restart from './features/restart';
import sendCommand from './features/sendCommand';
import start from './features/start';
import status from './features/status';
import stop from './features/stop';
import terminate from './features/terminate';

const adapter = {
    features: {
        backup,
        install,
        restart,
        sendCommand,
        start,
        status,
        stop,
        terminate
    }
};

export default adapter;