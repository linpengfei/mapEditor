/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import { Menu } from 'antd';
import "./index.scss";
const { SubMenu } = Menu;
type Props = {
  onClick: (type: string, key: string) => null,
};
type State = {};
class index extends Component<Props, State> {
  static defaultProps = {
    selectedKeys: [],
  };
  
  constructor(props: Props) {
    super(props);
    this.state = {};
  }
  handleClick = (e) => {
    console.log('click', e);
    if (e.keyPath.indexOf('draw') !== -1) {
      this.props.onClick({ type: 'draw', key: e.key });
    } else {
      this.props.onClick({ type: 'obj', key: e.key });
    }
  }
  render() {
    return <div className="map-editor-operation-plane">
      <Menu onClick={this.handleClick} mode="vertical">
        <Menu.Item key="select">
          <i className="iconfont icon-tubiao" title="选择" />
        </Menu.Item>
        <Menu.Item key="move">
          <i className="iconfont icon-yidong" title="移动" />
        </Menu.Item>
        <Menu.Item key="rotate">
          <i className="iconfont icon-xuanzhuan" title="旋转" />
        </Menu.Item>
        <Menu.Item key="scale">
          <i className="iconfont icon-suofang" title="缩放" />
        </Menu.Item>
        <SubMenu key="draw" title={ <i className="iconfont icon-brush" />}>
          <Menu.Item key="line"><i className="iconfont icon-zhixian-copy" title="直线" /></Menu.Item>
          <Menu.Item key="rect"><i className="iconfont icon-juxing" title="矩形" /></Menu.Item>
          <Menu.Item key="circle"><i className="iconfont icon-yuan" title="圆形" /></Menu.Item>
          <Menu.Item key="polygon"><i className="iconfont icon-duobianxing" title="多边形" /></Menu.Item>
          <Menu.Item key="path"><i className="iconfont icon-lujing" title="路径" /></Menu.Item>
        </SubMenu>
      </Menu>
    </div>;
  }
}

export default index;