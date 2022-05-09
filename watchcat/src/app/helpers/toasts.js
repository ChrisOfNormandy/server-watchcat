import React from 'react';

import { toast } from 'react-toastify';

/**
 *
 * @param {*} message
 * @param {*} title
 * @returns
 */
function createToast(message, title) {
    return (
        <div>
            {
                title
                    ? <h3>{title}</h3>
                    : null
            }
            {message}
        </div>
    );
}

const toasts = {
    info: (message, title = null) => toast.info(createToast(message, title)),
    warning: (message, title = null) => toast.warn(createToast(message, title)),
    error: (message, title = null) => toast.error(createToast(message, title)),
    success: (message, title = null) => toast.success(createToast(message, title))
};

export default toasts;