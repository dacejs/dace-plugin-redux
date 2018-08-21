const path = require('path');

const updateEntry = (entries, oldFile, newFile) => {
  const index = entries.indexOf(oldFile);
  if (index > -1) {
    entries[index] = newFile;
  }
  return entries;
}

module.exports = {
  modify(config, { target }, webpackInstance, { paths }) {
    const appConfig = config;

    // 修改开发环境下浏览器端编译输出文件的名称
    let oldFile;
    let newFile;
    let entry;
    if (target === 'node') {
      oldFile = paths.ownServerIndexJs;
      newFile = 'server.js';
      entry = appConfig.entry;
    } else {
      oldFile = paths.ownClientIndexJs;
      newFile = 'client.js';
      entry = appConfig.entry.client;
    }
    appConfig.entry = updateEntry(entry, oldFile, path.resolve(__dirname, newFile));

    // 从 dace-plugin-redux 中读取 App.js
    appConfig.resolve.alias = {
      ...appConfig.resolve.alias,
      [require.resolve('dace/dist/core/components/App.js')]: path.resolve(__dirname, 'App.js')
    };
    return appConfig;
  }
};
