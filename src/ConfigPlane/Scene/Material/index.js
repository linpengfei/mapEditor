/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
// import {bindActionCreators, compose} from 'redux';
// import injectReducer from '@alpha/utils/injectReducer';
// import {connect} from 'react-redux';
import { Row, Col, Input, Button, Switch } from 'antd';
import { ObjectSelected, ObjectChanged } from '../../../Signal';
import { ChromePicker, TwitterPicker } from 'react-color';
import debounce from 'lodash/debounce';
import "./index.scss";
import {
  BoxBufferGeometry, BufferGeometry,
  CircleBufferGeometry,
  CylinderBufferGeometry, ExtrudeBufferGeometry,
  Geometry, Material,
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
  switch (para.type) {
    // case 'map':
    //   value = parseInt(value);
    //   break;
    case 'rgb':
      return '#' + value.getHexString();
      break;
  }
  return value;
}
function getValueType(value, type) {
  switch (type) {
    // case 'map':
    //   value = parseInt(value);
    //   break;
    case 'rgb':
      return value.getHexString();
      break;
  }
  return value;
}
function transformType(material){
  if (material.isMeshPhongMaterial) {
    return 'phong';
  }
  return 'material';
}
class index extends Component<Props, State> {
  static defaultProps = {};
  subscrition: Subscription;
  update: boolean;
  materialParaRenders: { [key: string]: Array<{[key: string]: any }>};
  material: Material;
  constructor(props: Props) {
    super(props);
    this.state = {
      uuid: null,
      type: null,
      parameters: {},
    };
    this.materialParaRenders = {
      phong: [
        { key: 'color', label: '颜色', type: 'rgb', default: '#000000' },
        // { key: 'map', label: '贴图', type: 'map', default: null },
        { key: 'emissive', label: '自发光颜色', type: 'rgb', default: '#000000'},
        // { key: 'emissiveMap', label: '自发光贴图', type: 'map', default: null},
        { key: 'wireframe', label: '线框', type: 'bool', default: false },
      ],
      material: [],
    };
    this.update = false;
    this.subscrition = ObjectSelected.subscribe().subscribe(res  => {
      console.log('material:',res);
      const { type, data } = res;
      this.update = false;
      if (!data) {
        this.setState({ parameters: null, type: null, uuid: null });
      } else {
        const { material, uuid } = data;
        const type = transformType(material);
        const paraInfo = this.materialParaRenders[type];
        const parameters = {};
        for (let i = 0; i < paraInfo.length; i++) {
          const para = paraInfo[i];
          parameters[para.key] = transformValue(para, material[para.key]);
        }
        console.log({ uuid, type, parameters});
        this.setState({ uuid, type, parameters}, () => {
          console.log(this.state);
        });
      }
    });
  }
  onParaChange = (para: Object, value: string) => {
    this.update = true;
    const { key, type } = para;
    const { parameters } = this.state;
    this.setState({ parameters: { ...parameters, [key]: value} });
  };
  onUpdateMaterial = debounce(() => {
    if (!this.update) {
      return false;
    }
    const { parameters, uuid, type } = this.state;
    ObjectChanged.dispatch({ type: 'material', data: { parameters: { ...parameters }, uuid, type }});
    this.update = false;
  }, 300);
  componentWillUnmount(): * {
    this.subscrition.unsubscribe();
  }
  
  renderMaterialPara = (para, parameters) => {
    const { type, key } = para;
    switch (type) {
      case 'rgb':
        return <TwitterPicker color={parameters[key]} onChangeComplete={color => this.onParaChange(para, color.hex)}/>
      case 'bool':
        return <Switch checked={parameters[key]} onChange={value => this.onParaChange(para, value)}/>;
      default:
        return null;
    }
  };
  render() {
    const { type, parameters } = this.state;
    const params = this.materialParaRenders[type] || [];
    return params.length ? (<div className="material-property-containers">
        {params.map(item => <Row key={item.key}>
          <Row>
            <Col span={4} offset={2}>{item.label}</Col>
            <Col span={18}>{this.renderMaterialPara(item, parameters)}</Col>
          </Row>
        </Row>)}
        <Button onClick={this.onUpdateMaterial}>更新</Button>
      </div>
    ) : null;
  }
}

export default index;