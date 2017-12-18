import React from 'react';
import {findDOMNode} from 'react-dom';
import classnames from 'classnames';

/**
 * 请毋在此组件中做任何数据处理和判断，确保传入的数据是直接可用于展示的。
 */

export default class FixedTable extends React.Component {
    static defaultProps = {
        baseClass: 'fixed-table', // 外层基础样式，若需要完全自定义样式，可覆盖该值
        defaultColumnWidth: 100, // 默认列宽度(px)
        singleSelect: true,
        multiSelect: false,
        selectFirst: false, // 是否默认选中第一行
        trSelectedCls: 'tr-selected',
        headDraggable: true,
        minHeadWidth: 25,
        maxHeadWidth: 300,
        handleYReachEnd: () => {}
    }

    state = {
        headLeft: '0',
        selected: this.props.selectFirst ? [0] : [],
        head: this.props.head
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        if (!this.scrollWrap) {
            this.scrollWrap = findDOMNode(this.refs.tableScrollWrap)
            this.scrollWrap.addEventListener('ps-scroll-x', this.setHeadPosition)
            this.scrollWrap.addEventListener('ps-y-reach-end', this.throttleYReachEnd)
        }

        if (this.props.headDraggable) {
            const headTable = findDOMNode(this.refs.headTable);
            headTable.addEventListener('mousedown', this);
        }
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            head: nextProps.head
        });
    }

    componentWillUnmount() {
        if (this.scrollWrap) {
            this.scrollWrap.removeEventListener('ps-scroll-x', this.setHeadPosition)
            this.scrollWrap = null
        }
    }

    componentDidUpdate(prevProps) {
        var shouldUpdate = this.props.head.length !== prevProps.head.length ||
                           this.props.body.length !== prevProps.body.length
        if (shouldUpdate) {
            this.updateScrollBar()
        }
        if (this.props.currentPage !== prevProps.currentPage) {
            this.scrollTop()
            this.scrollLeft()
        }
    }

    getHead() {
        return this.state.head;
    }

    getSelected = () => {
        return this.props.body.filter((item, i) => {
            return this.state.selected.includes(i);
        });
    }

    reset = () => {
        this.setState({
            selected: []
        });
    }

    setHeadPosition = (event) => {
        var target = event.target || event.srcElement
        var left = target.scrollLeft
        this.setState({
            headLeft: -left + 'px'
        })
    }

    handleYReachEnd = () => {
        this.props.handleYReachEnd()
    }

    onContextMenu = e => {
        if (typeof this.props.onContextMenu === 'function') {
            const hasMenu = this.props.onContextMenu(e);
            if (this.props.singleSelect && hasMenu) {
                const idx = +e.currentTarget.dataset.idx;
                const tmp = new Set([idx]);
                this.setState({
                    selected: Array.from(tmp)
                });
            }
        }
    }

    updateScrollBar() {
    }

    scrollTop(n = 0) {
        this.scrollWrap.scrollTop = n;
    }

    scrollLeft(n = 0) {
        this.scrollWrap.scrollLeft = n;
    }

    onTrClick = e => {
        const idx = +e.currentTarget.dataset.idx;
        var tmp = new Set(this.state.selected)
        if (this.props.multiSelect) {
            if (tmp.has(idx)) {
                tmp.delete(idx);
            } else {
                tmp.add(idx);
            }
        } else if (this.props.singleSelect) {
            tmp = new Set([idx]);
        }
        this.setState({
            selected: Array.from(tmp)
        });
    }

    onTrDbClick = e => {
        const idx = +e.currentTarget.dataset.idx;
        const data = this.props.body[idx];
        if ('function' === typeof this.props.onTrDbClick) {
            this.props.onTrDbClick(idx, data)
        }
    }

    getTableWidth = () => {
        let width = 0;
        this.getHead().forEach(item => {
            if (!item.hide) {
                let w = item.width;
                w = !isNaN(w) && w > 0 ? w : this.props.defaultColumnWidth;
                width += w + 1;
            }
        });
        width += 1;
        return width;
    }

    handleEvent = evt => {
        debugger;
        switch (evt.type) {
            case 'mousedown':
                if (evt.target.className === 'head-drag-bar') {
                    this.activeHeadIdx = evt.target.dataset.idx;
                    var width = this.getHead()[this.activeHeadIdx].width;
                    this.activeHeadWidth = !isNaN(width) && width > 0 ? width : this.props.defaultColumnWidth;
                    this.clickX = evt.clientX;
                    document.addEventListener('mousemove', this);
                    document.addEventListener('mouseup', this);
                    evt.preventDefault();
                }
                break;
            case 'mousemove':
                if (this.activeHeadIdx !== undefined) {
                    var w = evt.clientX - this.clickX + this.activeHeadWidth;
                    w = Math.max(this.props.minHeadWidth, w);
                    w = Math.min(this.props.maxHeadWidth, w);
                    this.setHeadWidth(this.activeHeadIdx, w);
                }
                break;
            case 'mouseup':
                if (this.activeHeadIdx !== undefined) {
                    document.removeEventListener('mousemove', this);
                    document.removeEventListener('mouseup', this);
                    this.activeHeadIdx = undefined;
                    if (this.props.store && typeof this.props.store.saveHead === 'function') {
                        this.props.store.saveHead(this.state.head);
                    }
                }
                break;
        }
    }

    setHeadWidth = (idx, width) => {
        const head = this.state.head;
        head[idx].width = width;
        this.setState({
            head
        });
    }

    renderHead() {
        const heads = [];
        this.getHead().forEach((item, idx) => {
            if (item.hide) return;

            const label = item.label || item.title;
            const width = !isNaN(item.width) && item.width > 0 ? item.width : this.props.defaultColumnWidth;
            let bar;
            if (this.props.headDraggable) {
                bar = <div className="head-drag-bar" data-idx={idx}></div>;
            }
            heads.push(<th key={idx} style={{width}} className={item.title}>{label}{bar}</th>);
        });
        return heads;
    }

    renderBody() {
        return this.props.body.map((bodyItem, bodyIndex) => {
            const tds = [];
            this.getHead().forEach((headItem, idx) => {
                if (headItem.hide) return;

                let width = !isNaN(headItem.width) && headItem.width > 0 ? headItem.width : this.props.defaultColumnWidth;
                if (headItem.extra) {
                    tds.push(<td key={idx} style={{width}} className={headItem.title}>{headItem.extra(bodyItem)}</td>);
                } else {
                    let data = bodyItem && bodyItem[headItem.title];
                    let className;
                    if (headItem.cls) {
                        if (typeof headItem.cls === 'function') {
                            className = classnames(headItem.title, headItem.cls(data, bodyItem));
                        } else {
                            className = classnames(headItem.title, `${headItem.cls}`);
                        }
                    } else {
                        className = headItem.title;
                    }
                    if (headItem.func && typeof headItem.func === 'function') {
                        data = headItem.func(data, bodyItem);
                    }
                    tds.push(<td key={idx} style={{width}} className={className}>{data}</td>);
                }
            });
            return (
                <tr
                    key={bodyIndex}
                    onDoubleClick={this.onTrDbClick}
                    onClick={this.onTrClick}
                    className={this.state.selected.includes(bodyIndex) ? this.props.trSelectedCls : ''}
                    data-idx={bodyIndex}
                    onContextMenu={this.onContextMenu}
                >
                    {tds}
                </tr>
            )
        });
    }

    renderBgBody() {
        return this.props.body.map((item, idx) => {
            return <tr
                key={idx}
                onDoubleClick={this.onTrDbClick}
                onClick={this.onTrClick}
                className={this.state.selected.includes(idx) ? this.props.trSelectedCls : ''}
                data-idx={idx}
                onContextMenu={this.onContextMenu}
            ><td></td></tr>
        });
    }

    render() {
        let className = this.props.baseClass;
        if (this.props.className) {
            className += ' ' + this.props.className;
        }
        const tableWidth = this.getTableWidth();

        return (
            <div className={className} id={this.state.id} style={{height: this.props.bodySize && this.props.bodySize.height}}>
                <div className="head-wrap">
                    <div className="head-table-wrap" style={{
                        marginLeft: this.state.headLeft
                    }}>
                        <table ref="headTable" style={{width: tableWidth}}>
                            <thead>
                                <tr>{this.renderHead()}</tr>
                            </thead>
                        </table>
                    </div>
                </div>
                <div ref="tableScrollWrap" className="body-wrap">
                    <div className="body-table-wrap">
                        <table className="fixed-table-bgtable">
                            <tbody>{this.renderBgBody()}</tbody>
                        </table>
                        <table style={{width: tableWidth}}>
                            <tbody>
                                {this.renderBody()}
                            </tbody>
                        </table>
                    </div>
                </div>
                {
                    this.props.loadMore &&
                    this.props.body &&
                    this.props.body.length ?
                        <div className="load-more" onClick={this.props.loadMore}>
                            加载更多
                        </div> : null
                }
            </div>
        )
    }
}

//     handleYReachEnd: PropTypes.func, //y轴滚动到底部事件
//     loadMore: PropTypes.func, //加载更多操作
