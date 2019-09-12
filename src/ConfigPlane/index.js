/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import { Tabs } from 'antd';
import "./index.scss";
import SettingPlane from './Setting';
type Props = {};
type State = {};
const { TabPane } = Tabs;
class index extends Component<Props, State> {
  static defaultProps = {};
  
  constructor(props: Props) {
    super(props);
    this.state = {};
  }
  
  render() {
    return <div className="map-editor-config-containers">
      <Tabs defaultActiveKey="1">
        <TabPane tab="场景" key="scene">
          Content of Tab Pane 1
        </TabPane>
        <TabPane tab="设置" key="setting">
          <SettingPlane />
        </TabPane>
      </Tabs>
    </div>;
  }
}

export default index;