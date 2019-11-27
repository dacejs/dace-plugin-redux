/* eslint react/no-did-mount-set-state: 0 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * 页面组件渲染前获取数据的装饰器
 * 装饰器会将数据获取的请求代码分别注入到组件的
 * 静态方法 `getInitialProps()` 和生命周期方法 `componentDidMount()`
 * 以简化开发编码
 *
 * @param {object} options
 * @param {function} options.reducer
 * @param {function|[function]} options.promise
 */
export default options => Target => class extends Component {
  static propTypes = {
    store: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props, Target);
  }

  async componentDidMount() {
    // 该方法在页面浏览器端渲染时会调用
    // 在浏览器端动态添加reducer
    const { store, match, location: { query } } = this.props;
    const { reducer, promise } = options;
    if (!promise) {
      throw new Error('getInitialProps must pass in an object containing the key `promise`');
    }
    if (reducer) {
      store.injectReducer(reducer);
    }
    await promise({ store, match, query });
  }

  /**
   * 服务器端渲染时会先调用该方法获取数据
   * 数据回来后通过 redux 更新 store
   *
   * @param {object} options
   * @param {function} options.reducer 需要动态绑定的 reducer
   * @param {function|[function]} options.promise 获取数据的 fetch 函数
   *
   * @return {Promise}
   */
  static getInitialProps(ctx) {
    // 该方法在页面服务器端渲染时会调用
    // 在服务器端动态添加 reducer
    const { reducer, promise } = options;
    const { DACE_SSR } = process.env;
    const ssr = DACE_SSR === 'true';
    if (!promise) {
      throw new Error('getInitialProps must pass in an object containing the key `promise`');
    }
    if (reducer) {
      ctx.store.injectReducer(reducer);
    }
    return ssr ? promise(ctx) : null;
  }

  render() {
    // 服务器端渲染时不需要显示 loading
    return <Target {...this.props} />;
  }
};
