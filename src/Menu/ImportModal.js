/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
// import {bindActionCreators, compose} from 'redux';
// import injectReducer from '@alpha/utils/injectReducer';
// import {connect} from 'react-redux';
import { ObjectAdded, MenuClicked } from '../Signal';
import {Button, Icon, Modal, Upload, Switch, Row, Col, message} from "antd";
import debounce from "lodash/debounce";
import {load3DSModel, loadGltfModel, loadObjModel} from "../modelImport";
type Props = {
  visible: boolean;
  onCancel: Function;
};
type State = {
  directory: boolean;
  loading: boolean;
  files: Array,
};

const modelLoadHandle = {
  'gltf': loadGltfModel,
  'obj': loadObjModel,
  '3ds': load3DSModel,
};
class ImportModal extends Component<Props, State> {
  cancel: boolean;
  static defaultProps = {
    visible: true,
    onCancel: f => f,
  };
  
  constructor(props: Props) {
    super(props);
    this.state = {
      directory: false,
      loading: false,
      files: [],
    };
    this.cancel = false;
  }
  upLoadMap = (file, files) => {
    console.log(files);
    this.setState({ files });
    // this.loadingModel(files);
    return false;
  };
  loadingModel = (files) => {
    this.setState({ loading: true });
    let rootFile, rootPath, type, mltUrl;
    const fileMap = new Map();
    files.forEach(file => {
      const { name, webkitRelativePath } = file;
      if (name.match(/\.(gltf|glb)$/i)) {
        type = 'gltf';
        rootFile = file;
        rootPath = '/' + webkitRelativePath.replace(file.name, '');
      }
      if(name.match(/\.obj$/i)) {
        type = 'obj';
        rootFile = file;
        rootPath = '/' + webkitRelativePath.replace(file.name, '');
      }
      if(name.match(/\.mtl$/i)) {
        mltUrl = file;
      }
      if(name.match(/\.3ds$/i)) {
        type = '3ds';
        rootFile = file;
        rootPath = '/' + webkitRelativePath.replace(file.name, '');
      }
      fileMap.set('/' + webkitRelativePath, file);
    });
    if (!rootFile) {
      message.error('No model asset found.');
      return false;
    }
    const fileURL = typeof rootFile === 'string'
      ? rootFile
      : URL.createObjectURL(rootFile);
    mltUrl && (mltUrl = URL.createObjectURL(mltUrl));
    modelLoadHandle[type](fileURL, rootPath, fileMap, mltUrl).then(res => {
      if (typeof rootFile === 'object') URL.revokeObjectURL(fileURL);
      if (this.cancel) {
        this.cancel = false;
        return;
      }
      MenuClicked.dispatch({ type: 'import', data: res });
      this.handleCancel();
    }).catch(err => {
      this.setState({ loading: false });
    });
  };
  handleOk = () => {
    const { files = [] } = this.state;
    if (files.length) {
      this.loadingModel(files);
    } else {
      message.info('请先上传模型文件');
    }
  };
  handleCancel = () => {
    this.cancel = true;
    this.setState({ files: [], directory: false, loading: false });
    this.props.onCancel(false);
  };
  render() {
    const { visible } = this.props;
    const { directory, loading, files } = this.state;
    return <Modal
        title="导入"
        visible={visible}
        onOk={this.handleOk}
        onCancel={this.handleCancel}
        confirmLoading={loading}
      >
      文件夹：<Switch checked={directory} onChange={ directory => { this.setState({ directory })} }/>
      <br/>
      <Upload name="file" fileList={files} beforeUpload={this.upLoadMap} showUploadList={true} directory={directory}>
        <Button>
          <Icon type="upload" /> 上传模型
        </Button>
      </Upload>
      </Modal>;
  }
}

export default ImportModal;