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
import { Tabs } from 'antd';
import MeshPlane from './Mesh';
import GeometryPlane from './Geometry';
const { TabPane } = Tabs;
type Props = {};
type State = {};

class index extends Component<Props, State> {
  static defaultProps = {};
  
  constructor(props: Props) {
    super(props);
    this.state = {};
  }
  
  render() {
    return <div className="map-editor-scene-config-containers">
      <div className="scene-object-containers">
        
      </div>
      <Tabs defaultActiveKey="mesh">
        <TabPane tab="属性" key="mesh" forceRender={true}>
          <MeshPlane />
        </TabPane>
        <TabPane tab="几何" key="geometry" forceRender={true}>
          <GeometryPlane />
        </TabPane>
        <TabPane tab="材质" key="material" forceRender={true}>
          Content of Tab Pane 3
        </TabPane>
      </Tabs>
    </div>;
  }
}

export default index;