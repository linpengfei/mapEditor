/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import { Input, Select } from 'antd';
import './index.scss';
import { getInfoData, sendValueSet } from "./InfoCommunicateServer";
import { Subscription } from "rxjs";
const { Option } = Select;
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
        console.log(data);
        if (uuid) {
            this.setState({ ...data });
        } else {
            this.setState({ type: null , uuid: null, points: [], height: null, z: null });
        }
    };
    onValueChange = (type, index, position, value) => {
        const { type: oldType } = this.state;
        const valueData = { ...this.state, type: type || oldType };
        switch (type) {
            case 'line':
            case 'rect':
            case 'polygon':
            case 'circle':
                valueData.points[index][position] = parseFloat(value) || 0;
                break;
            case 'mark':
                if (index !== null) {
                    valueData.points[index][position] = parseFloat(value) || 0;
                } else {
                    valueData[position] = value;
                }
                break;
            default:
                valueData[position] = parseFloat(value) || 0;
                break;
        }
        sendValueSet({ type: 'modify', data: valueData });
        this.setState({ ...valueData });
    };
    deleteObj = () => {
        sendValueSet({ type: 'delete', data: { ...this.state }});
    };
    renderInfo = () => {
        let ret = <div>
            请点击选择物体!
        </div>;
        const { type, uuid, points, height, z, radius, content, width, placement } = this.state;
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
                    <button onClick={this.deleteObj}>删除</button>
                </div>;
                break;
            case 'mark':
                ret = <div className="infoContainer">
                    <div className="infoItem">
                        <span>类型:标记</span>
                    </div>
                    <div className="infoItem">
                        <div className="pointInfo">
                            <span>位置:</span>
                            <br/>
                            <span>x:</span><Input value={points[0].x} onChange={e => { this.onValueChange(type, 0, 'x', e.target.value)}}/>
                            <br/>
                            <span>y:</span><Input value={points[0].y} onChange={e => { this.onValueChange(type, 0, 'y', e.target.value)}}/>
                            <br/>
                            <span>z:</span><Input value={z} onChange={e => { this.onValueChange(type, null, 'z', e.target.value)}}/>
                        </div>
                        <div className="pointInfo">
                            <span>宽度:</span>
                            <Input value={width} onChange={e => { this.onValueChange(type, null, 'width', parseFloat(e.target.value))}}/>
                        </div>
                        <div className="pointInfo">
                            <span>高度:</span>
                            <Input value={height} onChange={e => { this.onValueChange(type, null, 'height',parseFloat(e.target.value))}}/>
                        </div>
                        <div className="pointInfo">
                            <span>内容:</span>
                            <Input value={content} onChange={e => { this.onValueChange(type, null, 'content', e.target.value)}}/>
                        </div>
                        <div className="pointInfo">
                            <span>文字位置:</span>
                            <br/>
                            <Select defaultValue={placement} name="placement" style={{ width: '100%' }} placeholder="请选择文字位置" onChange={value => { this.onValueChange(type, null, 'placement', value)}}>
                                <Option value="top">上方</Option>
                                <Option value="bottom">下方</Option>
                            </Select>
                        </div>
                    </div>
                    <button onClick={this.deleteObj}>删除</button>
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
            <button onClick={this.deleteObj}>删除</button>
        </div>;
    };
    render() {
        return <div className="infoPlaneContainer">
            { this.renderInfo() }
        </div>;
    }
}
