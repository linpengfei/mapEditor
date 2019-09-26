/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import { Input, Upload } from 'antd';
import { ConfigChanged } from '../../Signal';
import {Subscription} from "rxjs";
import debounce from 'lodash/debounce';
type Props = {
  width: number,
  height: number,
  scale: number,
};
type State = {
  scene: {
    width: number,
    height: number,
    scale: number,
  },
  previewVisible: boolean,
  previewImage: string,
  fileList: Array,
};
function transFormValue(type, value) {
  switch (type) {
    case 'int':
      const temp = parseInt(value);
      if (!isNaN(temp)) {
        value = temp;
      } else if (value !== '-') {
        value = 0;
      }
      break;
    case 'string':
      break;
    default:
      break;
  }
  return value;
}
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
class index extends Component<Props, State> {
  subscription: Subscription;
  constructor(props: Props) {
    super(props);
    this.state = {
      scene: {
        width: 0,
        height: 0,
        scale: 1,
      },
      previewVisible: false,
      previewImage: '',
      fileList: [],
    };
  }
  componentDidMount(): * {
    this.subscription = ConfigChanged.subscribe().subscribe(res => { 
      const { scene } = res;
      this.setState({ scene: { ...scene } });
    });
  }
  componentWillUnmount(): * {
    this.subscription.unsubscribe();
  }
  onValueChange = (value, key, type) =>{
    value = transFormValue(type, value);
    this.setState({ scene: { ...this.state.scene, [key]: value } }, () => {
      this.onConfigChange();
    });
  };
  onConfigChange = debounce(() => {
    const { scene } = this.state;
    ConfigChanged.modify({ scene: {...scene }});
  }, 1000);
  handleChange = ({ fileList }) => {
    this.setState({ fileList: fileList.splice(-1)}, () => {
      ConfigChanged.modify({ map: this.state.fileList[0] });
    });
  };
  render() {
    const { scene = {}, fileList } = this.state;
    const { width, height, scale } = scene;
    return <div className="setting-containers">
      <Input addonBefore="名称:" value={width} onChange={e => this.onValueChange(e.target.value, 'name')} />
      <Input addonBefore="宽度:" addonAfter="px" value={width} onChange={e => this.onValueChange(e.target.value, 'width', 'int')} />
      <Input addonBefore="高度:" addonAfter="px" value={height} onChange={e => this.onValueChange(e.target.value, 'width', 'int')} />
      <Input addonBefore="比例尺:" addonAfter="m/px" value={scale} onChange={e => this.onValueChange(e.target.value, 'width', 'int')} />
      <Upload
        action="/"
        beforeUpload={() => false}
        listType="picture-card"
        fileList={fileList}
        onChange={this.handleChange}
      >
        <div className="ant-upload-text">上传底图</div>
      </Upload>
    </div>;
  }
}

export default index;