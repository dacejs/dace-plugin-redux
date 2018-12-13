module.exports = {
  plugins: ['redux'],
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
