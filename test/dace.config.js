module.exports = {
  // 创建 axios 实例的文件路径
  // DACE_AXIOS_INSTANCE_PATH: 'src/axios.js',

  // 加上 dace-plugin-redux
  plugins: ['redux'],

  // 修改 webpack 配置
  modify(config, { target }) {
    const appConfig = config;
    if (target === 'web') {
      // 模拟 http://localhost:3001/api 返回
      appConfig.devServer.proxy = {
        '/api': {
          bypass: (req, res) => {
            res.json(req.headers);
          }
        }
      }
    }

    return appConfig;
  }
};
