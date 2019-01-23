import { Component } from 'react';
import { renderRoutes, matchRoutes } from 'react-router-config';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { parse } from 'qs';

/**
 * 网站入口组件
 * 服务器端和浏览器端渲染都会调用
 */
@connect(state => state)
export default class App extends Component {
  static propTypes = {
    store: PropTypes.object.isRequired,
    route: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
  }

  async componentWillReceiveProps(nextProps/* , nextState */) {
    const { store } = this.props;
    const navigated = nextProps.location.pathname !== this.props.location.pathname;
    if (navigated) {
      // 浏览器端路由（首次渲染后）时解析 querystring -> object
      const query = parse(nextProps.location.search, { ignoreQueryPrefix: true });
      nextProps.location.query = query;

      const promises = matchRoutes([this.props.route], nextProps.location.pathname)
        .map(({ route, match }) => {
          const { component } = route;
          if (component && component.getInitialProps) {
            const ctx = { match, query, store };
            const { getInitialProps } = component;
            return getInitialProps ? getInitialProps(ctx) : null;
          }
          return null;
        })
        .filter(Boolean);

      try {
        await Promise.all(promises);
      } catch (e) {
        console.log('getInitialProps error: ', e);
      }
    }
  }

  render() {
    const { route, store, location } = this.props;
    // 让 children 能通过 props.location.query 能取到 query string
    // App 组件首次渲染时执行
    location.query = parse(location.search, { ignoreQueryPrefix: true });
    return renderRoutes(route.routes, { ...store.getState(), store });
  }
}
