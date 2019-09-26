/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
// import {bindActionCreators, compose} from 'redux';
// import injectReducer from '@alpha/utils/injectReducer';
// import {connect} from 'react-redux';
import { MenuClicked } from '../Signal';
import { Button, Icon, Modal, Upload, Switch, Row, Col, message, Input } from "antd";
import debounce from "lodash/debounce";
type Props = {
  visible: boolean;
  onCancel: Function;
};
type State = {
  name: string, // 导出名字
  trs: boolean, // 保留旋转，位移属性
  onlyVisible: boolean, // 仅导出可见
  binary: boolean, // 二进制文件
  embedImages: boolean, // 内联资源
  animation: boolean, // 导出动画
};
class ExportModal extends Component<Props, State> {
  cancel: boolean;
  static defaultProps = {
    visible: true,
    onCancel: f => f,
  };
  
  constructor(props: Props) {
    super(props);
    this.state = {
      trs: false,
      onlyVisible: true,
      binary: false,
      embedImages: true,
      animation: false, 
    };
    this.cancel = false;
  }
  upLoadMap = (file, files) => {
    console.log(files);
    this.setState({ files });
    // this.loadingModel(files);
    return false;
  };
  handleOk = () => {
    const { trs, onlyVisible, binary, embedImages, animation, name } = this.state;
    MenuClicked.dispatch({ type: 'export', data: { name, options: { trs, onlyVisible, binary, embedImages, animation }}});
  };
  handleCancel = () => {
    this.cancel = true;
    this.setState({ files: [], directory: false, loading: false });
    this.props.onCancel(false);
  };
  render() {
    const { visible } = this.props;
    const { trs, onlyVisible, binary, embedImages, animation, loading, name } = this.state;
    return <Modal
        title="导出"
        visible={visible}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
        confirmLoading={loading}
      >
      名称：<Input value={name} style={{ width: 'auto'}} onChange={e => this.setState({ name: e.target.value})} />
      <br/>
      保留当前状态：<Switch checked={trs} onChange={ trs => { this.setState({ trs })} }/>
      <br/>
      仅可见：<Switch checked={onlyVisible} onChange={ onlyVisible => { this.setState({ onlyVisible })} }/>
      <br/>
      二进制导出：<Switch checked={binary} onChange={ binary => { this.setState({ binary })} }/>
      <br/>
      内嵌资源：<Switch checked={embedImages} onChange={ embedImages => { this.setState({ embedImages })} }/>
      <br/>
      动画：<Switch checked={animation} onChange={ animation => { this.setState({ animation })} }/>
      </Modal>;
  }
}

export default ExportModal;