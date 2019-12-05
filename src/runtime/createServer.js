import express from 'express';
import cookieParser from 'cookie-parser';
import addStatic from 'dace/dist/runtime/utils/addStatic';
import addRoutes from 'dace/dist/runtime/utils/addRoutes';
import ssrMiddleware from 'dace-plugin-redux/dist/runtime/ssrMiddleware';

const server = express();

server.disable('x-powered-by');

// 挂载虚拟目录
addStatic(server);

// 解析 cookie
server.use(cookieParser());

// 挂载路由
addRoutes(server);

server.get('*', ssrMiddleware);

export default server;
