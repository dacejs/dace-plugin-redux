import path from 'path';

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
    // 如果使用的是 dace 默认的入口文件，修改之
    let oldFile;
    let newFile;
    if (target === 'node') {
      oldFile = require.resolve('dace/dist/runtime/server.js');
      newFile = 'runtime/server.js';
    } else {
      oldFile = require.resolve('dace/dist/runtime/client.js');
      newFile = 'runtime/client.js';
    }
    appConfig.entry = updateEntry(appConfig.entry, oldFile, path.resolve(__dirname, newFile));

    // 载入特定 loader
    appConfig.module.rules.unshift({
      test: require.resolve('./runtime/reduxMiddlewares'),
      loader: path.resolve(__dirname, 'loader.js'),
      options: { middlewares }
    });

    // 注入插件所需的环境变量
    if (!process.env.DACE_PATH_AXIOS_INSTANCE) {
      const axiosInstance = path.resolve(__dirname, 'runtime/axiosInstance');
      appConfig.plugins = [
        ...appConfig.plugins,
        new webpackInstance.DefinePlugin({
          'process.env.DACE_PATH_AXIOS_INSTANCE': JSON.stringify(axiosInstance)
        })
      ];
    }

    // 从 dace-plugin-redux 中读取 App.js
    appConfig.resolve.alias = {
      ...appConfig.resolve.alias,
      [require.resolve('dace/dist/runtime/components/App.js')]: path.resolve(__dirname, 'runtime/components/App.js')
    };

    return appConfig;
  }
};
