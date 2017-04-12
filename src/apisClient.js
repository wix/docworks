//import 'todomvc-common';
import App from './apis/app';
import React from 'react';
import ReactDOM from 'react-dom';

const initialState = window.initialState && JSON.parse(window.initialState) || {};

ReactDOM.render(
	<App/>,
	document.getElementById('todoapp')
);

if (module.hot) {
  module.hot.accept('./apis/app', () => {
    var NewApp = require('./apis/app').default;
    ReactDOM.render(
      <NewApp/>,
      document.getElementById('todoapp')
    );
  });
}

