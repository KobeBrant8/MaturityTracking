import axios from "axios";
import router from "../router/index";
import { Toast } from "vant";
const root = process.env.VUE_APP_BASE_URL;
axios.defaults.baseURL = root;
let pending = [];
const CancelToken = axios.CancelToken;
const jumpToErrorPage = (msg) => {
  router.push({
    path: "/errorInfo?msg=" + msg,
  });
};
const removePending = (config) => {
  for (let p = pending.length - 1; p >= 0; p--) {
    if (
      pending[p].u ===
      config.url + JSON.stringify(config.data) + "&" + config.method
    ) {
      if (pending[p].f) pending[p].f();
      pending.splice(p, 1);
    }
  }
};
//请求拦截器
axios.interceptors.request.use(
  (config) => {
    //发起请求时，取消掉当前正在进行的相同请求
    removePending(config);
    config.cancelToken = new CancelToken((c) => {
      pending.push({ u: config.url + JSON.stringify(config.data) + '&' + config.method, f: c })
    })
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.defaults.timeout = 300000;
//响应拦截器即异常处理
axios.interceptors.response.use(
  (response) => {
    removePending(response.config);
    let res = response.data;
    let data;
    try {
      if (typeof res === "string") {
        data = JSON.parse(res);
      } else {
        data = res;
      }
    } catch (e) {
      data = res; // 解析失败则保留原字符串
    }

    if (data.state === "success" || data.state == "1") {
      return data;
    } else if (data.HEADER && data.HEADER.SUCCEED === "1") {
      return data;
    } else {
      // 业务错误时抛出异常，防止走入 success 回调
      Toast.fail(data.message || '服务端出现问题');
      return Promise.reject(data);
    }
  },
  (err) => {
    if (err && err.response) {
      switch (err.response.status) {
        case 400:
          err.message = "错误请求";
          break;
        case 403:
          err.message = "拒绝访问";
          break;
        case 404:
          err.message = "请求错误,未找到该资源,404";
          jumpToErrorPage(err.message);
          break;
        case 405:
          err.message = "请求方法未允许";
          break;
        case 408:
          err.message = "请求超时";
          break;
        case 500:
          err.message = "服务器端出错,错误代码500";
          break;
        case 501:
          err.message = "网络未实现";
          break;
        case 502:
          err.message = "网络错误";
          break;
        case 503:
          err.message = "服务不可用,503";
          break;
        case 504:
          err.message = "网络超时,504";
          break;
        case 505:
          err.message = "http版本不支持该请求";
          break;
        default:
          err.message = `连接错误${err.response.status}`;
      }
      Toast.fail(err.message);
    } else {
      if (err.code === "ECONNABORTED" || err.message === "Network Error") {
        // 请求超时
        Toast.fail('请求超时');
      } else {
        err.message = "服务器端出错";
        Toast.fail(err.message);
      }
    }
    return Promise.reject(err);
  }
);

export default {
  //get请求
  get(url, param) {
    // axios.defaults.baseURL =[root][type]
    return axios({
      method: "get",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        // 'X-Access-Token': localStorage.getItem('qer') || undefined
      },
      url,
      params: param,
    }).finally(() => {
      // Toast.clear();
    });
  },
  //post请求
  post(url, param) {
    // axios.defaults.baseURL =[root][type]
    return axios({
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        // 'X-Access-Token': localStorage.getItem('qer') || undefined
      },
      url,
      data: param,
      // data: Qs.stringify(param), 
    }).finally(() => {
      // Toast.clear();
    });
  },
};
