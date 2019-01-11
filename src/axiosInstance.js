import axios from 'axios';

export default (req) => {
  const isClient = typeof window === 'object';

  let baseURL = process.env.DACE_API_BASE_URL;
  // 不传 DACE_API_BASE_URL 时使用当前域名
  if (req && !baseURL) {
    baseURL = `${req.protocol}://${req.headers.host}`;
  }

  let headers = {};
  if (!isClient) {
    // 服务器端请求 API 时，透传原始请求的 headers
    headers = {
      ...req.headers,
      'X-Real-IP': (req.ip || '').split(',')[0]
    };
  }

  return axios.create({
    baseURL,
    headers,
    withCredentials: true // 允许携带cookie
  });
};
