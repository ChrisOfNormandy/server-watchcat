/* eslint-disable react/prop-types */

import React from 'react';

import './styles/modal.css';

export default class Modal extends React.Component {
    render() {
        const drag = (e) => {
            let style = window.getComputedStyle(e.target, null);
            e.dataTransfer.setData(
                'text/plain',
                parseInt(style.getPropertyValue('left'), 10) - e.clientX + ',' + (parseInt(style.getPropertyValue('top'), 10) - e.clientY) + ',' + e.target.id
            );
        };

        return (
            <div
                id={this.id}
                className='modal'
                onDragStart={drag}
                draggable
            >
                <div
                    className='modal-header'
                >
                    <h1>
                        {this.title}
                    </h1>

                    <button
                        className='btn primary'
                        onClick={() => this.onClose(this.id)}
                    >
                        <i
                            className='icon bi bi-x-lg'
                        />
                    </button>
                </div>

                <div
                    className='modal-body'
                >
                    {this.children}
                </div>

                <div
                    className='modal-footer'
                >

                </div>
            </div>
        );
    }

    constructor(props) {
        super(props);

        const { id, title, onClose, children } = props;

        this.id = id;
        this.title = title;
        this.onClose = onClose;
        this.children = children;
    }
}