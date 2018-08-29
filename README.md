# dace-plugin-redux

该插件让 redux 和 dace 能一起工作。

插件不带数据缓存功能，开发者根据实际业务需求自己来设定缓存策略。

## 安装
```
npm i dace-plugin-redux
```

## 用法

在 `dace.config.js` 的插件中添加配置：

```js
module.exports = {
  plugins: ['redux']
};
```

## 参数

**特别注意**

`middlewares` 参数中的 js 代码目前只支持 `ES5` 语法。

### 使用封装好的 redux 中间件

```js
plugins: [
  ['redux', {
    middlewares: [ `require('redux-logger').default` ]
  }]
]
```

### 直接在配置中书写 redux 中间件

```js
plugins: [
  ['redux', {
    middlewares: [
      `function() {
        const createLogger = require('redux-logger').createLogger;
        return createLogger();
      }()`
    ]
  }]
]
```

## API

### getInitialProps 方法

#### 参数
getInitialProps 接收的上下文对象中除了[默认参数](api/get-initial-props.md)外，增加了 `store` ：

- store：这个参数是通过 redux 的 createStore 创建的 store 实例，详情请查阅 [redux 官方文档](https://redux.js.org/api/store)。

### `@getInitialProps` 装饰器

>非 redux 技术推荐直接使用 `getInitialProps` 静态方法。

该装饰器主要是为了简化页面组件的编程，让代码看起来更简洁。装饰器做了两件事情：

- 在两端（服务器端、浏览器端）渲染时，分别执行 injectReducer 来注入页面相关的 reducer。
- 为页面组件绑定静态方法 `getInitialProps`。

#### 参数
`@getInitialProps` 接收一个对象参数，对象参数包含以下属性：

- reducer：和页面 action 相关的 reducer 。
- promise：需要绑定到静态方法 `getInitialProps` 的内容。

```js
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'dace';
import { getInitialProps } from 'dace-plugin-redux';
import { fetchPosts } from './action';
import reducer from './reducer';
import Layout from '../../layouts/default';

@getInitialProps({
  reducer,
  promise: ({ store }) => store.dispatch(fetchPosts())
})
@connect(state => state)
export default class Index extends Component {
  static propTypes = {
    posts: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string
    }))
  };

  static defaultProps = {
    posts: []
  }

  render() {
    return (
      <Layout>
        <h1>Post List</h1>
        <ol>
          {
            this.props.posts.map(post => (
              <li key={post.id}>
                <Link to={`/post/${post.id}`}>{post.title}</Link>
              </li>
            ))
          }
        </ol>
      </Layout>
    );
  }
}
```
