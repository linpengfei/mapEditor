/**
 * @author:lpf
 * @flow
 *
 **/
import React, { Component, useState } from 'react';
import { Menu, Dropdown, Icon, Modal } from 'antd';
import { ObjectAdded } from '../Signal';
import ImportModal from "./ImportModal";
import ExportModal from "./ExportModal";
type Props = {};
type State = {};
function addObject({ key }) {
  ObjectAdded.dispatch({ type: key, data: { }});
}
const fileMenu = (
  <Menu onClick={addObject}>
    <Menu.Item key="import">导入</Menu.Item>
    <Menu.Item key="export">导出</Menu.Item>
    <Menu.Item key="clear">清除</Menu.Item>
  </Menu>
);
const addMenu = (
  <Menu onClick={addObject}>
    <Menu.Item key="box">正方体</Menu.Item>
    <Menu.Item key="circle">圆</Menu.Item>
    <Menu.Item key="cylinder">圆柱体</Menu.Item>
    <Menu.Item key="sphere">球</Menu.Item>
  </Menu>
);
function menu(props: Props) {
  const [importVisible, changeImportVisible] = useState(false);
  const [exportVisible, changeExportVisible] = useState(false);
  return <div className="map-editor-menu">
    <Dropdown overlay={(
      <Menu onClick={({key}) => {
        if(key === 'import') {
          changeImportVisible(true);
          return;
        }
        if (key === 'export') {
          changeExportVisible(true);
          return;
        }
        ObjectAdded.dispatch({ type: key, data: { }});
      }}>
        <Menu.Item key="import">导入</Menu.Item>
        <Menu.Item key="export">导出</Menu.Item>
        <Menu.Item key="clear">清除</Menu.Item>
      </Menu>
    )}>
      <span>文件</span>
    </Dropdown>
    <Dropdown overlay={addMenu}>
      <span>添加</span>
    </Dropdown>
    <ImportModal 
      visible={importVisible}
      onCancel={changeImportVisible}
    />
    <ExportModal 
      visible={exportVisible} 
      onCancel={changeExportVisible}
    />
  </div>
}
export default menu;