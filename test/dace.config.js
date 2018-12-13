module.exports = {
  plugins: ['redux'],
  modify(config, { target }) {
    const appConfig = config;
    if (target === 'web') {
      // 模拟 /api 接口返回
      appConfig.devServer.before = (app) => {
        app.get('/api', (req, res) => {
          res.json(req.headers);
        });
      };
    }

    return appConfig;
  }
};
