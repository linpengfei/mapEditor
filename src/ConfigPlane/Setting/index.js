/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import { Input } from 'antd';
type Props = {
  width: number,
  height: number,
  scale: number,
};
type State = {};

class index extends Component<Props, State> {
  static defaultProps = {
    width: 0,
    height: 0,
    scale: 1,
  };
  
  constructor(props: Props) {
    super(props);
    this.state = {};
  }
  
  render() {
    const { width, height, scale } = this.props;
    return <div className="setting-containers">
      <Input addonBefore="宽度:" addonAfter="px" value={width} />
      <Input addonBefore="高度:" addonAfter="px" value={height} />
      <Input addonBefore="比例尺:" addonAfter="m/px" value={scale} />
    </div>;
  }
}

export default index;