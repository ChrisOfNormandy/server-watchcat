import React from 'react';
import FTPView from './FTPView';
import ConsoleView from './ConsoleView';
import modalManager from './ModalManager';
import socketHandler from './socketHandler';

import './styles/view.css';
import './styles/terminal.css';

export default class ServerView extends React.Component {
    openModal(id, modal) {
        const state = this.state;
        state.modals.set(id, modal);
        this.setState(state);
    }

    closeModal(id) {
        const state = this.state;
        state.modals.delete(id);
        this.setState(state);
    }

    render() {
        let body = null;

        this.views.forEach((view) => {
            if (view.accessor === this.state.view)
                body = view.body();
        });

        return <>
            <nav>
                {
                    this.views.map((view, i) =>
                        <button
                            key={i}
                            className='btn primary'
                            onClick={
                                () => {
                                    let state = this.state;
                                    state.view = view.accessor;
                                    this.setState(state);
                                }
                            }
                        >
                            {view.header}
                        </button>
                    )
                }
            </nav>

            <main>
                {body}
            </main>

            {
                Array.from(this.state.modals.keys())
                    .map((key, i) =>
                        <div
                            key={i}
                            id={`modal_${key}`}
                        >
                            {this.state.modals.get(key)}
                        </div>
                    )
            }
        </>;
    }

    constructor(props) {
        super(props);

        this.featureFlags = props.featureFlags;

        this.views = [
            {
                header: 'Console',
                accessor: 'console',
                body: () => <ConsoleView
                    featureFlags={this.featureFlags}
                />
            },
            {
                header: 'Files',
                accessor: 'ftp',
                body: () => <FTPView />
            }
        ];

        this.state = {
            modals: new Map(),
            view: 'console'
        };

        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this);

        modalManager.init(this.openModal, this.closeModal);
        socketHandler.connect();
    }
}