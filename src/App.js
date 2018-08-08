import { Component } from 'react';
import { renderRoutes, matchRoutes } from 'react-router-config';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

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
    const store = this.props.store;
    const navigated = nextProps.location !== this.props.location;
    if (navigated) {
      window.scrollTo(0, 0);

      const promises = matchRoutes([this.props.route], nextProps.location.pathname)
        .map(({ route, match }) => {
          const { component } = route;
          if (component && component.getInitialProps) {
            const ctx = { match, store };
            const { getInitialProps } = component;
            return getInitialProps ? getInitialProps(ctx) : null;
          }
          return null;
        })
        .filter(Boolean);

      try {
        const [initialProps] = await Promise.all(promises);
        // this.setState({ initialProps });
      } catch (e) {
        console.log('getInitialProps error: ', e);
      }
    }
  }

  render() {
    const { route, store } = this.props;
    return renderRoutes(route.routes, store.getState());
  }
}
