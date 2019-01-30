import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { matchRoutes, renderRoutes } from 'react-router-config';
import express from 'express';
import { renderToString } from 'react-dom/server';
import { getLoadableState } from 'loadable-components/server';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import serialize from 'serialize-javascript';
import { document } from 'dace';
import { RedBoxError } from 'redbox-react';
import NotFound from 'dace/dist/runtime/components/NotFound';
import renderTags from 'dace/dist/runtime/utils/renderTags';
import addProxy from 'dace/dist/runtime/utils/addProxy';
import addStatic from 'dace/dist/runtime/utils/addStatic';
import routes from './routes';
import createStore from './createStore';

const server = express();

// 绑定请求代理
addProxyTable(server);

// 挂载虚拟目录
addStatic(server);

server
  .disable('x-powered-by')
  .get('*', async (req, res) => {
    const store = createStore(req);
    // 查找当前 URL 匹配的路由
    const { query, _parsedUrl: { pathname } } = req;
    const ssr = process.env.DACE_SSR === 'true';
    const branch = matchRoutes(routes, pathname);
    // 匹配的最后一个组件是 `NotFound` 的话，表示地址不存在
    const notFound = branch[branch.length - 1].route.component.name === 'NotFound';

    if (notFound) {
      const html = document({
        markup: renderToString(<NotFound location={{ pathname }} />)
      });
      res.status(200).end(html);
    } else {
      let initialProps = {};
      if (ssr) {
        const promises = branch // <- react-router 不匹配 querystring
          .map(async ({ route, match }) => {
            const { component } = route;
            if (component) {
              if (component.load && !component.loadingPromise) {
                // 预加载 loadable-component
                // 确保服务器端第一次渲染时能拿到数据
                await component.load();
              }
              if (component.getInitialProps) {
                const ctx = { match, store, query, req, res };
                const { getInitialProps } = component;
                return getInitialProps ? getInitialProps(ctx) : null;
              }
            }
            return null;
          })
          .filter(Boolean);

        // 执行 getInitialProps ，在此之后的 store 中将包含数据
        await Promise.all(promises);
      }

      const jsTags = renderTags(branch, 'js');
      const cssTags = renderTags(branch, 'css');

      const context = {};
      const Markup = ssr ? (
        <Provider store={store}>
          <StaticRouter context={context} location={req.url}>
            {renderRoutes(routes, { store })}
          </StaticRouter>
        </Provider>
      ) : null;

      const loadableState = await getLoadableState(Markup);

      let markup;
      try {
        markup = renderToString(Markup);
      } catch (error) {
        res.status(500);
        markup = renderToString(<RedBoxError error={error} />);
      }

      // renderStatic 需要在 root 元素 renderToString 后执行
      const head = Helmet.renderStatic();
      const state = serialize(store.getState());
      const html = document({
        head,
        cssTags,
        jsTags,
        markup,
        state,
        loadableState: loadableState.getScriptTag()
      });
      res.status(200).send(html);
    }
  });

export default server;
