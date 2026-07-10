import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'MaturityTracking',
    component: () => import( /* webpackChunkName: "maturity-tracking" */ '@/views/MaturityTracking.vue'),
    meta: { title:"成熟时间追踪"}
  },
  {
    path: '/recycle-bin',
    name: 'RecycleBin',
    component: () => import( /* webpackChunkName: "recycle-bin" */ '@/views/RecycleBin.vue'),
    meta: { title:"回收站"}
  },
  {
    path: '/difficulty-analysis',
    name: 'DifficultyAnalysis',
    component: () => import( /* webpackChunkName: "difficulty-analysis" */ '@/views/DifficultyAnalysis.vue'),
    meta: { title:"难度分析"}
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { x: 0, y: 0 }
  }
})

export default router
