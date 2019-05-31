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
};

export default class InfoPlane extends Component<Props, State> {
    static defaultProps = {};

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
        const { uuid, points = [], type } = data;
        if (uuid) {
            this.setState({ uuid, points, type });
        } else {
            this.setState({ type: null , uuid: null, points: [] });
        }
    };
    onValueChange = (index, position, value) => {
        const { points, type, uuid } = this.state;
        const valueData = { uuid, points: points.slice(), type };
        switch (type) {
            case 'line':
            case 'rect':
            case 'polygon':
                valueData.points[index][position] = value;
                break;
            case 'circle': break;
            default: break;
        }
        sendValueSet(valueData);
        this.setState({ points: valueData.points });
    };
    renderInfo = () => {
        let ret = <div>
            请点击选择物体!
        </div>;
        const { type, uuid, points } = this.state;
        switch (type) {
            case 'line':
                ret = this.rendInfoDetail(uuid, '直线', points);
                break;
            case 'rect':
                ret = this.rendInfoDetail(uuid, '矩形', points);
                break;
            case 'polygon':
                ret = this.rendInfoDetail(uuid, '多边形', points);
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
                            <span>x:</span><Input value={points[0].x}/>
                            <br/>
                            <span>y:</span><Input value={points[0].y}/>
                        </div>
                        <div className="pointInfo">
                            <span>半径:</span>
                            <Input value={Math.sqrt(Math.pow(points[1].positionX - points[0].positionY, 2) + Math.pow(points[1].positionY - points[0].positionY, 2))}/>
                        </div>
                    </div>
                </div>;
                break;
            default:
                break;
        }
        return ret;
    };
    rendInfoDetail = (uuid, type, points) => {
        return <div className="infoContainer">
            {/*<div className="infoItem">*/}
            {/*    <span>uuid:</span>{uuid}*/}
            {/*</div>*/}
            <div className="infoItem">
                <span>类型:{type}</span>
            </div>
            <div className="infoItem">
                {points.map((item, i) =>
                    <div className="pointInfo" key={i}>
                        point{i+1}:
                        <br/>
                        <span>x:</span><Input value={item.x} onChange={e => { this.onValueChange(i, 'x', e.target.value)}}/>
                        <br/>
                        <span>y:</span><Input value={item.y} onChange={e => { this.onValueChange(i, 'y', e.target.value)}}/>
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
