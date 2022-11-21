import React from 'react';
import Modal from '../components/modals/Modal';

class ModalBase {
    canBeDragged() {
        this.options.draggable = true;

        return this;
    }

    setTitle(title) {
        this.title = title;

        return this;
    }

    setFooter(footer) {
        this.footer = footer;

        return this;
    }

    addSection(...sect) {
        this.sections.push(...sect);

        return this;
    }

    build() {
        const m = <Modal
            id={this.id}
            title={this.title}
            footer={this.footer}
            onClose={this.onClose}
        >
            {
                this.sections.map((sect, i) =>
                    <div
                        key={i}
                        className='modal-section'
                    >
                        {sect}
                    </div>
                )
            }

            {this.body}
        </Modal>;

        this.open(this.id, m);
    }

    /**
     *
     * @param {string} id
     * @param {JSX.Element} body
     * @param {function()} open
     * @param {function()} onClose
     */
    constructor(id, body, open, onClose) {
        this.id = id;
        this.body = body;
        this.open = open;
        this.onClose = onClose;
        this.title = null;
        this.footer = null;

        this.sections = [];

        this.options = {
            draggable: false
        };
    }
}

class ModalManager {
    /**
     *
     * @param {function(string, JSX.Element)} openModal
     * @param {function(string)} closeModal
     */
    init(openModal, closeModal) {
        this.open = openModal;
        this.close = closeModal;

        return this;
    }

    create(id, body) {
        return new ModalBase(id, body, this.open, this.close);
    }

    constructor() {
        /**
         * @type {function(string, JSX.Element)}
         */
        this.open = null;
        /**
         * @type {function(string)}
         */
        this.close = null;
    }
}

const modalManager = new ModalManager();

export default modalManager;