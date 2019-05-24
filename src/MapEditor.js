/**
 * @author:lpf
 * @flow
 *
 **/
import React, {Component} from 'react';
import { Layout, Menu, Icon, Dropdown } from 'antd';
import Sketchpad from './Sketchpad';
import ActionPlane from './actionPlane';
import { sendActionSignal, getActionSignal } from "./SignalService";
const { Sider, Content, Header } = Layout;
const { SubMenu, ItemGroup: MenuItemGroup, Divider } = Menu;
type Props = {};
type State = {};

export default class MapEditor extends Component<Props, State> {
    static defaultProps = {};
    constructor(props) {
        super(props);
        this.state = {};
    }

    onAction = (action) => {
        console.log(action);
        sendActionSignal(action.key);
    };
    render() {
        return <div className="editorMainContainers">
            <div className="actionContainer">
                <ActionPlane />
            </div>
            <div className="editorContent">
                <Sketchpad />
            </div>
            <div className="infoWindow">
                cc
            </div>
        </div>
    }
}
