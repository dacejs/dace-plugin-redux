const { getOptions } = require('loader-utils');

// 为了取到 this ，函数声明时不能使用箭头函数
module.exports = function loader() {
  const { middlewares } = getOptions(this) || { middlewares: [] };

  // 该 loader 未使用 babel 转换，middlewares 中的代码请使用 es5 编写
  return `
    module.exports = [${middlewares.join(',')}];
  `;
};
