/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import "./index.scss";
import {bindCallback, Observable, Subscription, pipe} from "rxjs";
import { Menu, Icon, Collapse } from 'antd';
import { sendDrawSignal } from "./DrawSinglServer";
const { Panel } = Collapse;
type Props = {};
type State = {
    drawShape: 'line' | 'rect' | 'polygon' | 'circle' | null,
};

export default class ActionPlane extends Component<Props, State> {
    static defaultProps = {};

    actionSubscription: Subscription;
    constructor(props) {
        super(props);
        this.state = {
            drawShape: null,
        };
    }
    selectSquare = (type: string) => {
        console.log(type);
        if (type === this.state.drawShape) {
            return;
        }
        this.setState({ drawShape: type }, () => {
            sendDrawSignal({ type: 'draw', data: { drawShape: this.state.drawShape }});
        });
    };
    render() {
        const { drawShape } = this.state;
        return <div className="actionPlaneContainers">
            <Collapse
                expandIconPosition="right"
            >
                <Panel header={<div>
                    <><i className="mapEditor mapselect"/>选择元素</>
                </div>} key="select">
                </Panel>
                <Panel header={<div>
                    <><i className="mapEditor mapts-focus-point" />标记点</>
                </div>} key="poi">
                </Panel>
                <Panel header={<div>
                    <><i className="mapEditor map-graphics-editor" />绘制元素</>
                </div>} key="draw">
                    <div className="drawContainer">
                        <div className="drawItem">
                            <span>形状</span>
                            <div className="squareContainers">
                                <i className={`mapEditor mapLine${drawShape === 'line' ? ' select' : ''}`} onClick={() => this.selectSquare('line')} title="直线"/>
                                <i className={`mapEditor mapvector${drawShape === 'rect' ? ' select' : ''}`} onClick={() => this.selectSquare('rect')} title="矩形"/>
                                <i className={`mapEditor mapvectorpolygon${drawShape === 'polygon' ? ' select' : ''}`} onClick={() => this.selectSquare('polygon')} title="多边形"/>
                                <i className={`mapEditor mapicon-yuanxk${drawShape === 'circle' ? ' select' : ''}`} onClick={() => this.selectSquare('circle')} title="圆形"/>
                            </div>
                        </div>
                        <div className="drawItem">
                            <span>颜色</span>
                        </div>
                        <div className="drawItem">
                            <span>高度</span>
                        </div>
                    </div>
                </Panel>
            </Collapse>
        </div>;
    }
}
