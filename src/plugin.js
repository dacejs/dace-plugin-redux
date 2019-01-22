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
    const { middlewares = [] } = options;
    const appConfig = config;

    // 修改 entry 文件
    const { DACE_PATH_CLIENT_ENTRY, DACE_PATH_SERVER_ENTRY } = process.env;
    let oldFile;
    let newFile;
    if (target === 'node') {
      oldFile = DACE_PATH_SERVER_ENTRY;
      newFile = 'server.js';
    } else {
      oldFile = DACE_PATH_CLIENT_ENTRY;
      newFile = 'client.js';
    }
    appConfig.entry = updateEntry(appConfig.entry, oldFile, path.resolve(__dirname, newFile));

    // 载入特定 loader
    appConfig.module.rules.unshift({
      test: require.resolve('./reduxMiddlewares'),
      loader: path.resolve(__dirname, 'loader.js'),
      options: { middlewares }
    });

    // 从 dace-plugin-redux 中读取 App.js
    appConfig.resolve.alias = {
      ...appConfig.resolve.alias,
      [require.resolve('dace/dist/runtime/components/App.js')]: path.resolve(__dirname, 'App.js')
    };
    return appConfig;
  }
};
