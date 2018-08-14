const path = require('path');

module.exports = {
  modify(config, { target }) {
    const appConfig = config;

    // 修改开发环境下浏览器端编译输出文件的名称
    const entry = target === 'node' ? 'httpd' : 'client';
    appConfig.entry = path.resolve(__dirname, `${entry}.js`);
    // 从 dace-plugin-redux 中读取 App.js
    appConfig.resolve.alias = {
      ...appConfig.resolve.alias,
      [require.resolve('dace/dist/core/components/App.js')]: path.resolve(__dirname, 'App.js')
    };
    return appConfig;
  }
};
