const pxtovw = require('postcss-px-to-viewport');
const autoprefixer = require('autoprefixer');
const path = require('path');
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const productionGzipExtensions = ['js', 'css']
module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/', //配置根目录
  outputDir: 'dist',
  productionSourceMap: process.env.NODE_ENV !== 'production', //不需要生产环境的 source map，可以将其设置为 false
  css: {
    loaderOptions: {
      less: {
        // 若 less-loader 版本小于 6.0，请移除 lessOptions 这一级，直接配置选项。
        // lessOptions: {
          modifyVars: {
            
            // 或者可以通过 less 文件覆盖（文件路径为绝对路径）
             hack: `true; @import "${path.join(__dirname, './src/assets/css/vant_theme.less')}";`
          },
        // },
      },
      postcss: {
        plugins: [
          autoprefixer(),
          new pxtovw({
            unitToConvert: 'px', //需要转换的单位，默认为"px"；
            viewportWidth: 375, //设计稿的视口宽度
            unitPrecision: 5, //单位转换后保留的小数位数
            propList: ['*'], //要进行转换的属性列表,*表示匹配所有,!表示不转换
            viewportUnit: 'vw', //转换后的视口单位
            fontViewportUnit: 'vw', //转换后字体使用的视口单位
            selectorBlackList: [], //不进行转换的css选择器，继续使用原有单位
            minPixelValue: 1, //设置最小的转换数值
            mediaQuery: false, //设置媒体查询里的单位是否需要转换单位
            replace: true, //是否直接更换属性值，而不添加备用属性
            exclude: [/node_modules/] //忽略某些文件夹下的文件
          })
        ]
      },
      
    },
    
  },
  configureWebpack:{
    resolve:{
      alias:{
        '@':path.resolve(__dirname, './src'),
        '@i':path.resolve(__dirname, './src/assets'),
      }
    },
    plugins: [
      // 下面是下载的插件的配置
      new CompressionWebpackPlugin({
        algorithm: 'gzip',
        test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'),
        threshold: 10240,
        minRatio: 0.8
      })
    ]
  },
  devServer: {
    overlay: { // 让浏览器 overlay 同时显示警告和错误
      warnings: true,
      errors: true
    },
    host: '0.0.0.0',
    port: 8070,
    https: false, // https:{type:Boolean}
    open: true, //配置自动启动浏览器
    hotOnly: true, // 热更新
  }
}