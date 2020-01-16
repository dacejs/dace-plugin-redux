import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';
import mergeable from 'redux-merge-reducers';
import axiosInstance from 'dace/dist/runtime/axiosInstance';

/**
 * 创建 store
 *
 * @param {object} initialState state 初始值
 * @param {Express.Request} req
 * @return {store}
 */
export default (req) => {
  const isClient = typeof window === 'object';
  const initialState = isClient ? window.INITIAL_STATE : {};

  if (req) {
    axiosInstance.defaults.baseURL = `${req.protocol}://${req.headers.host}`;
    // 透传 headers
    axiosInstance.defaults.headers = {
      ...req.headers,
      'Original-Url': req.url
    };
  }

  const middlewares = [thunk.withExtraArgument(axiosInstance)]
    .concat(require('./reduxMiddlewares'));

  // 初始化使用的默认 reducer
  const initialReducer = (state = {}) => state;
  const store = createStore(
    initialReducer,
    initialState,
    composeWithDevTools(applyMiddleware(...middlewares))
  );

  // 保存已经存在于 store 中的 reducer ，以便于后续 replaceReducer 时使用
  store.reducers = initialReducer;
  // 记录已经注入的 reducer ，避免重复注入
  store.asyncReducers = [];
  store.injectReducer = (newReducer) => {
    // 将新增的 reducer 和已经存在的 reducer 合并
    // 注意：
    // 这里不使用 combineReducer
    // 因为 combineReducer 需要一开始就把 store 的形状确定好（MUST be a shaped store）
    // 而实际上我们希望页面初始时什么都没有，所有资源都是懒加载

    // 支持批量注入 reducers #3
    let mergedReducer = store.reducers;
    if (!Array.isArray(newReducer)) {
      newReducer = [newReducer];
    }

    newReducer.forEach((reducer) => {
      const reducerToString = reducer.toString();
      if (store.asyncReducers.indexOf(reducerToString) === -1) {
        mergedReducer = mergeable(reducer).merge(mergedReducer);
        // 存储序列化的 reducer
        store.asyncReducers.push(reducerToString);
      }
    });
    store.replaceReducer(mergedReducer);
    store.reducers = mergedReducer;
    return store;
  };

  return store;
};
