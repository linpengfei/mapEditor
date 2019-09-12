import React, { Component } from 'react';
import './App.scss';
import Menu from './Menu';
import Editor from './Editor';
import Config from './ConfigPlane';
import Three from './three';
import MapEditor from './MapEditor';
class App extends Component {
  render() {
    return (
      <div className="map-editor-containers">
        <div className="map-editor-menu-container">
          <Menu />
        </div>
        <div className="map-editor-content-container">
          <Editor />
          <Config />
        </div>
      </div>
    );
  }
}

export default App;
