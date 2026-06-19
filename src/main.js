import Vue from 'vue'
import App from './App.vue'
import router from './router'
// import store from './store' 
import ajax from '@/utils/ajax'
import '@/assets/css/base.css'
import vueWechatTitle from "vue-wechat-title";
Vue.use(vueWechatTitle);
Vue.config.productionTip = false
Vue.prototype.$ajax = ajax
import wx from 'weixin-js-sdk'
Vue.use(wx);
import { Icon } from 'vant';
Vue.use(Icon);

new Vue({
  router,
  // store,
  render: h => h(App)
}).$mount('#app')
