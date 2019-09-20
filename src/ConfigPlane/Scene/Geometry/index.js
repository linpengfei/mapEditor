/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
// import {bindActionCreators, compose} from 'redux';
// import injectReducer from '@alpha/utils/injectReducer';
// import {connect} from 'react-redux';
import { Row, Col, Input, Button } from 'antd';
import { ObjectSelected, ObjectChanged } from '../../../Signal';
import debounce from 'lodash/debounce';
import "./index.scss";
import {
  BoxBufferGeometry, BufferGeometry,
  CircleBufferGeometry,
  CylinderBufferGeometry, ExtrudeBufferGeometry,
  Geometry,
  Math as _Math,
  SphereBufferGeometry
} from "three";
import {Subscription} from "rxjs";
type Props = {};
type State = {
  type: string,
  uuid: string,
  parameters: Object,
};
function transformValue(para: Object, value){
  if (value !== undefined) {
    if (para.type !== 'deg') {
      return value;
    } else {
      return value * _Math.RAD2DEG;
    }
  } else {
    return para.default;
  }
}
function getValueType(value, type) {
  switch (type) {
    case 'int':
      value = parseInt(value);
      break;
    case 'float':
      value = parseFloat(value);
      break;
    case 'deg':
      value = parseFloat(value);
      value = _Math.DEG2RAD * value;
      break;
  }
  if (isNaN(value)) {
    return 0;
  }
  return value;
}
function transformType(type){
  switch (type) {
    case "BoxBufferGeometry":
      type = 'box';
      break;
    case "CircleBufferGeometry":
      type = 'circle';
      break;
    case "CylinderBufferGeometry":
      type = 'cylinder';
      break;
    case "SphereBufferGeometry":
      type = 'sphere';
      break;
    case "ExtrudeBufferGeometry":
      type = 'geometry';
      break;
    default:
      type = 'geometry';
      break;
  }
  return type;
}
class index extends Component<Props, State> {
  static defaultProps = {};
  subscrition: Subscription;
  update: boolean;
  geometryParaRenders: { [key: string]: Array<{[key: string]: string | Function}>};
  geometry: BufferGeometry;
  constructor(props: Props) {
    super(props);
    this.state = {
      uuid: null,
      type: null,
      parameters: {},
    };
    this.geometryParaRenders = {
      box: [
        { key: 'width', label: '长度', type: 'int', default: 1 },
        { key: 'height', label: '宽度', type: 'int', default: 1},
        { key: 'depth', label: '高度', type: 'int', default: 1},
        { key: 'widthSegments', label: '长度分段', type: 'int', default: 1 },
        { key: 'heightSegments', label: '宽度分段', type: 'int', default: 1 },
        { key: 'depthSegments', label: '高度分段', type: 'int', default: 1 },
      ],
      circle: [
        { key: 'radius', label: '半径', type: 'int', default: 1},
        { key: 'segments', label: '分段', type: 'int', default: 1},
        { key: 'thetaStart', label: '起始角度', type: 'deg', default: 0},
        { key: 'thetaLength', label: '角度', type: 'deg', default: 360}
      ],
      cylinder: [
        { key: 'radiusTop', label: '顶部半径', type: 'int', default: 1},
        { key: 'radiusBottom', label: '底部半径', type: 'int', default: 1},
        { key: 'height', label: '高度', type: 'int', default: 1},
        { key: 'radialSegments', label: '水平分段', type: 'int', default: 1},
        { key: 'heightSegments', label: '高度分段', type: 'int', default: 1},
      ],
      sphere: [
        { key: 'radius', label: '半径', type: 'int', default: 1 },
        { key: 'widthSegments', label: '水平分段数', type: 'int', default: 1 },
        { key: 'heightSegments', label: '垂直分段数', type: 'int', default: 1 },
        { key: 'phiStart', label: '水平起始角度', type: 'deg', default: 0 },
        { key: 'phiLength', label: '水平角度', type: 'deg', default: 360 },
        { key: 'thetaStart', label: '垂直起始角度', type: 'deg', default: 0 },
        { key: 'thetaLength', label: '垂直角度', type: 'deg', default: 360 }
      ],
      geometry: [],
    };
    this.update = false;
    this.subscrition = ObjectSelected.subscribe().subscribe(res  => {
      console.log('geometry:',res);
      const { type, data } = res;
      this.update = false;
      if (!data) {
        this.setState({ parameters: null, type: null, uuid: null });
        this.geometry = null;
      } else {
        const { geometry, uuid } = data;
        this.geometry = geometry;
        const type = transformType(geometry.type);
        const paraInfo = this.geometryParaRenders[type];
        const parameters = {};
        for (let i = 0; i < paraInfo.length; i++) {
          const para = paraInfo[i];
          parameters[para.key] = transformValue(para, geometry.parameters[para.key]);
        }
        this.setState({ uuid, type, parameters});
      }
    });
  }
  onParaChange = (para: Object, value: string) => {
    this.update = true;
    const { key, type } = para;
    const { parameters } = this.state;
    this.setState({ parameters: { ...parameters, [key]: value} });
    this.geometry.parameters[key] = getValueType(value, type);
  };
  onUpdateGeometry = debounce(() => {
    if (!this.update) {
      return false;
    }
    const { parameters, uuid, type } = this.state;
    ObjectChanged.dispatch({ type: 'geometry', data: { ...parameters, uuid, type }});
    this.update = false;
  }, 300);
  componentWillUnmount(): * {
    this.subscrition.unsubscribe();
  }
  
  render() {
    const { type, parameters } = this.state;
    const params = this.geometryParaRenders[type] || [];
    return params.length ? (<div className="geometry-property-containers">
      {params.map(item => <Row key={item.key}>
        <Row>
          <Col span={4} offset={2}>{item.label}</Col>
          <Col span={18}><Input value={parameters[item.key]} onChange={ e => this.onParaChange(item, e.target.value)}/></Col>
        </Row>
      </Row>)}
      <Button onClick={this.onUpdateGeometry}>更新</Button>
      </div>
) : null;
  }
}

export default index;