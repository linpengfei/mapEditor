/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import { Input } from 'antd';
import './index.scss';
import { getInfoData, sendValueSet } from "./InfoCommunicateServer";
import { Subscription } from "rxjs";
type Props = {};
type State = {
    visible: boolean,
    type: 'line'|'rect'|'polygon'|'circle'|null,
    points: Array,
    name: string,
    uuid: string,
    height: number,
    z: number,
    radius?: number,
};

export default class InfoPlane extends Component<Props, State> {
    static defaultProps = {};
    static transformType(type) {
        switch (type) {
            case 'line':
                return '直线';
            case 'rect':
                return '矩形';
            case 'polygon':
                return '多边形';
            case 'circle':
                return '圆形';
            default:
                break;
        }
        return '';
    }
    infoDataSub: Subscription;
    constructor(props) {
        super(props);
        this.state = {
            type: null,
        };
        this.infoDataSub = getInfoData().subscribe(this.getInfo);
    }

    componentWillUnmount() {
        this.infoDataSub.unsubscribe();
    }
    getInfo = data => {
        const { uuid } = data;
        if (uuid) {
            this.setState({ ...data });
        } else {
            this.setState({ type: null , uuid: null, points: [], height: null, z: null });
        }
    };
    onValueChange = (type, index, position, value) => {
        const { points, uuid, type: oldType, z, height } = this.state;
        const valueData = { uuid, points: points.slice(), type: type || oldType, z, height };
        switch (type) {
            case 'line':
            case 'rect':
            case 'polygon':
            case 'circle':
                valueData.points[index][position] = parseFloat(value);
                break;
            default:
                valueData[position] = parseFloat(value);
                break;
        }
        sendValueSet(valueData);
        console.log(valueData);
        this.setState({ ...valueData });
    };
    renderInfo = () => {
        let ret = <div>
            请点击选择物体!
        </div>;
        const { type, uuid, points, height, z, radius } = this.state;
        switch (type) {
            case 'line':
            case 'rect':
            case 'polygon':
                ret = this.rendInfoDetail(type, { uuid, points, height, z });
                break;
            case 'circle':
                ret = <div className="infoContainer">
                    {/*<div className="infoItem">*/}
                    {/*    <span>uuid:</span>{uuid}*/}
                    {/*</div>*/}
                    <div className="infoItem">
                        <span>类型:圆形</span>
                    </div>
                    <div className="infoItem">
                        <div className="pointInfo">
                            <span>圆心:</span>
                            <br/>
                            <span>x:</span><Input value={points[0].x} onChange={e => { this.onValueChange(type, 0, 'x', e.target.value)}}/>
                            <br/>
                            <span>y:</span><Input value={points[0].y} onChange={e => { this.onValueChange(type, 0, 'y', e.target.value)}}/>
                        </div>
                        <div className="pointInfo">
                            <span>半径:</span>
                            <Input value={radius} onChange={e => { this.onValueChange('', null, 'radius', e.target.value)}}/>
                        </div>
                    </div>
                </div>;
                break;
            default:
                break;
        }
        return ret;
    };
    rendInfoDetail(type, para) {
        const { points = [], height, z } = para;
        return <div className="infoContainer">
            {/*<div className="infoItem">*/}
            {/*    <span>uuid:</span>{uuid}*/}
            {/*</div>*/}
            <div className="infoItem">
                <span>类型:{InfoPlane.transformType(type)}</span>
            </div>
            <div className="infoItem">
                <div className="pointInfo">
                    <span>z:</span><Input value={z} onChange={e => { this.onValueChange('', null, 'z', e.target.value)}}/>
                    <br/>
                    <span>height:</span><Input value={height} onChange={e => { this.onValueChange('', null, 'height', e.target.value)}}/>
                </div>
                {points.map((item, i) =>
                    <div className="pointInfo" key={i}>
                        point{i+1}:
                        <br/>
                        <span>x:</span><Input value={item.x} onChange={e => { this.onValueChange(type, i, 'x', e.target.value)}}/>
                        <br/>
                        <span>y:</span><Input value={item.y} onChange={e => { this.onValueChange(type, i, 'y', e.target.value)}}/>
                    </div>
                )}
            </div>
        </div>;
    };
    render() {
        return <div className="infoPlaneContainer">
            { this.renderInfo() }
        </div>;
    }
}
