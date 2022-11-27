import React from 'react';

import './styles/modal.scss';

export default class Modal extends React.Component {
    /**
     *
     * @param {MouseEvent} e
     */
    dragStart(e) {
        e.preventDefault();

        this.cOffX = e.clientX - this.element.offsetLeft;
        this.cOffY = e.clientY - this.element.offsetTop;

        document.addEventListener('mousemove', this.dragMove);
        document.addEventListener('mouseup', this.dragEnd);

        this.element.classList.add('moving');
    }

    /**
     *
     * @param {MouseEvent} e
     */
    dragMove(e) {
        e.preventDefault();

        this.element.style.top = (e.clientY - this.cOffY).toString() + 'px';
        this.element.style.left = (e.clientX - this.cOffX).toString() + 'px';
    }

    /**
     *
     * @param {MouseEvent} e
     */
    dragEnd(e) {
        e.preventDefault();

        document.removeEventListener('mousemove', this.dragMove);
        document.removeEventListener('mouseup', this.dragEnd);

        this.element.classList.remove('moving');
    }

    componentDidMount() {
        this.element = document.getElementById(this.id);
    }

    render() {
        return (
            <div
                id={this.id}
                className='modal'
            >
                <div
                    className='modal-header'
                    onMouseDown={this.dragStart}
                >
                    {
                        this.title
                            ? <h1
                                className='modal-title'
                            >
                                {this.title}
                            </h1>
                            : <span />
                    }

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
                    {this.footer}
                </div>
            </div>
        );
    }

    constructor(props) {
        super(props);

        const { id, title, onClose, footer, children } = props;

        this.id = id;
        this.title = title;
        this.onClose = onClose;
        this.footer = footer;
        this.children = children;

        this.element = null;

        this.cOffX = 0;
        this.cOffY = 0;

        this.dragStart = this.dragStart.bind(this);
        this.dragMove = this.dragMove.bind(this);
        this.dragEnd = this.dragEnd.bind(this);
    }
}