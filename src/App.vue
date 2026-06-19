<template>
  <div id="app">
    <transition name="fade-transform" mode="out-in">
      <router-view v-wechat-title="$route.meta.title" />
    </transition>
  </div>
</template>
<script>
export default {
  data() {
    return {};
  }
};
</script>
<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100%;
}
/* fade-transform */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.4s;
}

.fade-transform-enter {
  opacity: 0;
  // transform: translateX(130px);
}

.fade-transform-leave-to {
  opacity: 0;
  // transform: translateX(-130px);
}
.nav {
  padding: 10px 30px;
  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
