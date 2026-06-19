## 环境要求
```
   1、安装 node => http://nodejs.cn/download/
   2、下载常用编辑器 vscode or webstorm or other
   3、使用cnpm 先安装cnpm => npm install cnpm -g --	registry=https://registry.npm.taobao.org
 ```
## 安装依赖
```
npm install or cnpm install
```
### 测试环境运行
```
npm run serve
```
### 打包生产
```
npm run build
```
### 项目备注
```
package.json 配置文件 依赖包 
dist 目录为打包好的内容 可直接放线上
node_modules 依赖包
public 项目入口文件 + 静态文件 + 虚拟数据

document 项目文档 项目结构说明 附属文件存放 （原型 ui 文档）

.env 环境变量设置
.gitignore git忽略文件 忽略 因为我们使用svn svn可以右键ignore
babel 设置babel 
vue.config.js vue-cli 配置

src  所有业务模块
    assets 静态文件
    components 公共模块
    router  vue-router
    store   状态管理
    utils  常用工具包
    view   页面组件
    App.vue 主模块
    main.js 入口文件
```
