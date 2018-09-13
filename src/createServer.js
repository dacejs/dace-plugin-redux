import React from 'react';
import { StaticRouter } from 'react-router-dom';
import { matchRoutes, renderRoutes } from 'react-router-config';
import express from 'express';
import { renderToString } from 'react-dom/server';
import { Helmet } from 'react-helmet';
import { Provider } from 'react-redux';
import serialize from 'serialize-javascript';
import { document } from 'dace';
import RedBox from 'dace/dist/core/components/RedBox';
import urlrewrite from 'packing-urlrewrite';
import routes from './routes';
import createStore from './createStore';

// 防止 rules 配置文件不存在时报错
let rules;
try {
  rules = require(process.env.DACE_MOCK_RULES_CONFIG);
} catch (e) {
  rules = {};
}

const server = express();
server
  .disable('x-powered-by')
  .use(express.static(process.env.DACE_BUILD_PATH))
  .use(urlrewrite(rules))
  .get('*', async (req, res) => {
    const store = createStore();
    // 查找当前 URL 匹配的路由
    const { query, _parsedUrl: { pathname } } = req;
    const promises = matchRoutes(routes, pathname)
      .map(({ route, match }) => {
        const ctx = { match, store, query, req, res };
        const { getInitialProps } = route.component;
        return getInitialProps ? getInitialProps(ctx) : null;
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
        const routeName = req.url.substring(1) || 'home';
        return item.initial || item.names[0] === routeName;
      })
      .reduce((accumulator, item) => {
        accumulator = accumulator.concat(item.files);
        return accumulator;
      }, []);

    const renderTags = (extension, assets) => {
      const getTagByFilename = filename => (filename.endsWith('js') ?
        `<script src="${publicPath + filename}"></script>` :
        `<link rel="stylesheet" href="${publicPath + filename}" />`);

      return assets
        .filter(item => !/\.hot-update\./.test(item)) // 过滤掉 HMR 包
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
      const html = document({ head, cssTags, jsTags, markup, state });
      res.status(200).send(html);
    }
  });

export default server;
