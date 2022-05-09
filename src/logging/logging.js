const format = {
    Reset: '\x1b[0m',
    Bright: '\x1b[1m',
    Dim: '\x1b[2m',
    Underscore: '\x1b[4m',
    Blink: '\x1b[5m',
    Reverse: '\x1b[7m',
    Hidden: '\x1b[8m',

    FgBlack: '\x1b[30m',
    FgRed: '\x1b[31m',
    FgGreen: '\x1b[32m',
    FgYellow: '\x1b[33m',
    FgBlue: '\x1b[34m',
    FgMagenta: '\x1b[35m',
    FgCyan: '\x1b[36m',
    FgWhite: '\x1b[37m',

    BgBlack: '\x1b[40m',
    BgRed: '\x1b[41m',
    BgGreen: '\x1b[42m',
    BgYellow: '\x1b[43m',
    BgBlue: '\x1b[44m',
    BgMagenta: '\x1b[45m',
    BgCyan: '\x1b[46m',
    BgWhite: '\x1b[47m',
};

const tags = {
    debug: `[ DEBUG ] ${format.BgGreen}$${format.Reset} `,
    info: `[  INFO ] ${format.BgBlue}$${format.Reset} `,
    warn: `[  WARN ] ${format.BgYellow}$${format.Reset} `,
    error: `[ ERROR ] ${format.BgRed}$${format.Reset} `
};

const getStack = () => {
    const s = new Error().stack.split('at ');

    return s[s.length - 1].trim();
};

const formatOut = (tag, ...args) => {
    const msg = args.filter((arg) => typeof arg !== 'object').join(' ');

    const len = Math.round(process.stdout.columns / 2);
    let spacing = len - msg.length;
    if (spacing < 1)
        spacing = 1;

    return [`${tag}${msg}${' '.repeat(spacing)}| ${getStack()}`]
        .concat(...args.filter((arg) => typeof arg === 'object'));
};

const logging = {
    debug(...args) {
        console.log(...formatOut(tags.debug, ...args));
    },
    info(...args) {
        console.info(...formatOut(tags.info, ...args));
    },
    warn(...args) {
        console.warn(...formatOut(tags.warn, ...args));
    },
    error(...args) {
        console.error(...formatOut(tags.error, ...args));
    },
    success(mcServer, ...args) {
        const msg = args.filter((arg) => typeof arg !== 'object').join(' ');
        if (mcServer)
            mcServer.pushEmit('srvsuccess', msg);
        logging.info(...args);
    },
    debugEmit(mcServer, ...args) {
        const msg = args.filter((arg) => typeof arg !== 'object').join(' ');
        if (mcServer)
            mcServer.pushEmit('srvdebug', msg);
        logging.debug(...args);
    },
    infoEmit(mcServer, ...args) {
        const msg = args.filter((arg) => typeof arg !== 'object').join(' ');
        if (mcServer)
            mcServer.pushEmit('srvinfo', msg);
        logging.info(...args);
    },
    warnEmit(mcServer, ...args) {
        const msg = args.filter((arg) => typeof arg !== 'object').join(' ');
        if (mcServer)
            mcServer.pushEmit('srvwarn', msg);
        logging.warn(...args);
    },
    errorEmit(mcServer, ...args) {
        const msg = args.filter((arg) => typeof arg !== 'object').join(' ');
        if (mcServer)
            mcServer.pushEmit('srverr', msg);
        logging.error(...args);
    }
};

module.exports = logging;