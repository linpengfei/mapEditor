/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
// import {bindActionCreators, compose} from 'redux';
// import injectReducer from '@alpha/utils/injectReducer';
// import {connect} from 'react-redux';
import "./index.scss";
import { Row, Col, Input, InputNumber, Button } from 'antd';
import { ObjectSelected, ObjectChanged } from '../../../Signal';
import { Subscription } from "rxjs";
import {Math as _Math, Mesh} from "three";
import debounce from 'lodash/debounce';
import {extrudeSettings} from "../../../Config";

type Props = {};
type State = {
  uuid: string,
  name: string,
  path: Array<{x: number, y: number, z: number}>,
  depth: number,
  position: {
    x: number,
    y: number,
    z: number,
  },
  rotation: {
    x: number,
    y: number,
    z: number,
  },
  scale: {
    x: number,
    y: number,
    z: number,
  },
};
const typeDictionary = {
  line: '直线',
  rect: '矩形',
  circle: '圆形',
  polygon: '多边形',
  path: '路径',
};
class index extends Component<Props, State> {
  static defaultProps = {};
  selectObj: Mesh;
  subscrition: Subscription;
  update: boolean;
  constructor(props: Props) {
    super(props);
    this.state = {};
    this.update = false;
    this.subscrition = ObjectSelected.subscribe().subscribe((res = {}) => {
      console.log('mesh', res);
      // this.drawTempObj.userData = { type: this.operation, path: this.drawPath, ...JSON.parse(JSON.stringify(extrudeSettings)) };
      const { type, data } = res;
      this.selectObj = data;
      this.update = false;
      if (!data) {
        this.setState({ uuid: undefined });
      } else {
        const { position, scale, rotation, userData = {}, uuid, name } = data;
        const { path, depth, type } = userData;
        this.setState({ 
          position: { x: position.x, y: position.y, z: position.z }, 
          scale: {x: scale.x, y: scale.y, z: scale.z },
          rotation: { x: rotation.x * _Math.RAD2DEG, y: rotation.y * _Math.RAD2DEG, z: rotation.z * _Math.RAD2DEG },
          uuid,
          name,
          path,
          depth,
          type,
        });
      }
    });
  }
  componentWillUnmount(): * {
    return this.subscrition.unsubscribe();
  }
  
  onChange = (key, index, attr, value) => {
    const temp = this.state[key];
    if (value !== undefined) {
      // path 改变
      temp[index][attr] = value;
      this.update = true;
      this.setState({ [key]: [ ...temp ] });
    } else if (attr !== undefined) {
      // position rotation scale
      temp[index] = attr;
      this.setState({ [key]: { ...temp }});
      this.selectObj[key][index] = key === 'rotation' ? attr * _Math.DEG2RAD : attr;
    } else if (index !== undefined) {
      // name path depth
      this.setState({ [key]: index });
      if (key === 'name') {
        this.selectObj[key] = index;
      }
    }
  };
  onUpdatePath = debounce( () => {
    const { path, depth, uuid, type } = this.state;
    const { userData: oldUserData = {} } = this.selectObj;
    const { depth: oldDepth } = oldUserData;
    if (this.update || depth !== oldDepth) {
      ObjectChanged.dispatch({ type: 'path', data: { path, depth, uuid, type }});
    }
    this.update = false;
  }, 300);
  render() {
    const { uuid, name, position, scale, rotation, path, depth, type } = this.state;
    return uuid ? <div className="mash-property-containers">
      <Row>
        <Col span={4} offset={2}>ID</Col>
        <Col span={18}>{uuid}</Col>
      </Row>
      <Row>
        <Col span={4} offset={2}>名称</Col>
        <Col span={18}><Input value={name} onChange={e => this.onChange('name', e.target.value)}/></Col>
      </Row>
      <Row>
        <Col span={4} offset={2}>位置</Col>
        <Col span={6}>
          <InputNumber value={position.x} parser={value => parseFloat(value)} onChange={value => this.onChange('position', 'x', value)}/>
        </Col>
        <Col span={6}>
          <InputNumber value={position.y} parser={value => parseFloat(value)} onChange={value => this.onChange('position', 'y', value)}/>
        </Col>
        <Col span={6}>
          <InputNumber value={position.z} parser={value => parseFloat(value)} onChange={value => this.onChange('position', 'z', value)}/>
        </Col>
      </Row>
      <Row>
        <Col span={4} offset={2}>旋转</Col>
        <Col span={6}>
          <InputNumber value={rotation.x} parser={value => parseFloat(value)} onChange={value => this.onChange('rotation', 'x', value)}/>
        </Col>
        <Col span={6}>
          <InputNumber value={rotation.y} parser={value => parseFloat(value)} onChange={value => this.onChange('rotation', 'y', value)}/>
        </Col>
        <Col span={6}>
          <InputNumber value={rotation.z} parser={value => parseFloat(value)} onChange={value => this.onChange('rotation', 'z', value)}/>
        </Col>
      </Row>
      <Row>
        <Col span={4} offset={2}>缩放</Col>
        <Col span={6}>
          <InputNumber value={scale.x} parser={value => parseFloat(value)} onChange={value => this.onChange('scale', 'x', value)}/>
        </Col>
        <Col span={6}>
          <InputNumber value={scale.y} parser={value => parseFloat(value)} onChange={value => this.onChange('scale', 'x', value)}/>
        </Col>
        <Col span={6}>
          <InputNumber value={scale.z} parser={value => parseFloat(value)} onChange={value => this.onChange('scale', 'x', value)}/>
        </Col>
      </Row>
      {type ? <React.Fragment>
        <Row>
          <Col span={4} offset={2}>类型</Col>
          {/*TODO 类型转换*/}
          <Col span={18}>{typeDictionary[type]}</Col>
        </Row>
        <Row>
          <Col span={4} offset={2}>高度</Col>
          {/*TODO 类型转换*/}
          <InputNumber value={depth} parser={value => parseFloat(value)} onChange={value => this.onChange('depth', value)}/>
        </Row>
        {path.map((point, i) => <Row key={i}>
          <Col span={4} offset={2}>点{i+1}</Col>
          <Col span={6}>
            <InputNumber value={point.x} parser={value => parseFloat(value)} onChange={value => this.onChange('path', i, 'x',  value)}/>
          </Col>
          <Col span={6}>
            <InputNumber value={point.y} parser={value => parseFloat(value)} onChange={value => this.onChange('path', i, 'x', value)}/>
          </Col>
          <Col span={6}>
            <InputNumber value={point.z} parser={value => parseFloat(value)} onChange={value => this.onChange('path', i, 'x', value)}/>
          </Col>
        </Row>
        )}
        <Button onClick={this.onUpdatePath}>更新</Button>
      </React.Fragment> : null}
    </div> : null;
  }
}


export default index;