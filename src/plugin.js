const path = require('path');

const updateEntry = (entries, oldFile, newFile) => {
  const index = entries.indexOf(oldFile);
  if (index > -1) {
    entries[index] = newFile;
  }
  return entries;
};

module.exports = {
  modify(config, { target }, webpackInstance, options) {
    const { paths, middlewares = [] } = options;
    const appConfig = config;

    // 修改开发环境下浏览器端编译输出文件的名称
    let oldFile;
    let newFile;
    if (target === 'node') {
      oldFile = paths.ownServerIndexJs;
      newFile = 'server.js';
    } else {
      oldFile = paths.ownClientIndexJs;
      newFile = 'client.js';
    }
    appConfig.entry = updateEntry(appConfig.entry, oldFile, path.resolve(__dirname, newFile));

    appConfig.module.rules.unshift({
      test: require.resolve('./reduxMiddlewares'),
      loader: path.resolve(__dirname, 'loader.js'),
      options: { middlewares }
    });

    // 从 dace-plugin-redux 中读取 App.js
    appConfig.resolve.alias = {
      ...appConfig.resolve.alias,
      [require.resolve('dace/dist/core/components/App.js')]: path.resolve(__dirname, 'App.js')
    };
    return appConfig;
  }
};
