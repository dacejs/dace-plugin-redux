import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { hydrate } from 'react-dom';
import { loadableReady } from '@loadable/component';
import { renderRoutes } from 'react-router-config';
import { Provider } from 'react-redux';
import routes from './ssrRoutes';
import createStore from './createStore';

const store = createStore(window.INITIAL_STATE);

// 在渲染前加载好所需要的组件
loadableReady(() => {
  hydrate(
    <Provider store={store}>
      <BrowserRouter>
        {renderRoutes(routes, { store })}
      </BrowserRouter>
    </Provider>,
    document.getElementById('root')
  );
});

if (module.hot) {
  module.hot.accept();
}
