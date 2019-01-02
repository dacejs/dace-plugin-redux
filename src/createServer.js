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
import RedBox from 'dace/dist/core/components/RedBox';
import routes from './routes';
import createStore from './createStore';

const server = express();
server
  .disable('x-powered-by')
  .use(express.static(process.env.DACE_BUILD_PATH))
  .get('*', async (req, res) => {
    const store = createStore(req);
    // 查找当前 URL 匹配的路由
    const { query, _parsedUrl: { pathname } } = req;

    const promises = matchRoutes(routes, pathname) // <- react-router 不匹配 querystring
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

    if (!process.env.DACE_STATS_JSON) {
      throw new Error('Not found `DACE_STATS_JSON` in `process.env`');
    }
    const { publicPath, chunks } = require(process.env.DACE_STATS_JSON);
    // 获取初始化网页需要插入的 CSS/JS 静态文件
    const initialAssets = chunks
      .filter((item) => {
        const routeName = req.url.substring(1) || 'index';
        const routeNameWithIndex = `${routeName}/index`;
        // 将 vendor.js、styles.css、路由对应的.js 直接输出到 HTML 中
        return item.initial ||
          [routeName, routeNameWithIndex, 'styles'].indexOf(item.names[0]) > -1;
      })
      .reduce((accumulator, item) => {
        accumulator = accumulator.concat(item.files);
        return accumulator;
      }, []);

    const renderTags = (extension, assets) => {
      const getTagByFilename = filename => (filename.endsWith('js') ?
        `<script src="${publicPath + filename}" crossorigin="anonymous"></script>` :
        `<link rel="stylesheet" href="${publicPath + filename}" />`);

      return assets
        .filter(item => !/\.hot-update\./.test(item)) // 过滤掉 HMR 包
        // .filter(item => !/styles.[^.]{8}.chunk.js/.test(item)) // 过滤掉 styles.js
        .filter(item => item.endsWith(extension))
        .map(item => getTagByFilename(item))
        .join('');
    };

    const jsTags = renderTags('js', initialAssets);
    const cssTags = renderTags('css', initialAssets);

    const context = {};
    const Markup = (
      <Provider store={store}>
        <StaticRouter context={context} location={req.url}>
          {renderRoutes(routes, { store })}
        </StaticRouter>
      </Provider>
    );

    const loadableState = await getLoadableState(Markup);

    let markup;
    try {
      markup = renderToString(Markup);
    } catch (e) {
      // ctx.status = 500;
      res.status(500);
      markup = renderToString(<RedBox error={e} />);
    }

    // renderStatic 需要在 root 元素 render 后执行
    const head = Helmet.renderStatic();
    const state = serialize(store.getState());

    if (context.url) {
      res.redirect(context.url);
    } else {
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
