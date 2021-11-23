# webpack-loader-plugins

Handwritten implementation of loader &amp; plugins

手写实现 webpack loader 和 plugins

## 一、loader 的实现

### 1、简单 loader 的实现

loader 其实是一个函数，它的参数是匹配文件的源码，返回结果是处理后的源码。下面是一个最简单的 loader，它什么都没做：

```js
module.exports = function (source) {
  return source
}
```

下面给 loader 加上功能，将 *var* 关键词替换为 *const*：

```js
// src/loader1.js

module.exports = function (source) {
  return source.replace(/var/g, 'const')
}
```

到这里，一个简单的 loader 就写好了，接下来配置并测试 loader：

```js
// webpack.config.js

const path = require('path')

module.exports = {
  mode: 'development',
  entry: {
    main: './src/index.js'
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: path.resolve('./src/loader1.js')
          }
        ]
      }
    ]
  }
}
```

入口文件：

```js
// src/index.js

function test() {
  var a = 1
  var b = 2
  var c = 3
  console.log(a, b, c)
}

test()
```

运行 *npm run build*，得到打包文件 *dist/bundle.js*：

```js
/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ (() => {

eval("function test() {\n  const a = 1\n  const b = 2\n  const c = 3\n  console.log(a, b, c)\n}\n\ntest()\n\n\n//# sourceURL=webpack://webpack-loader-plugins/./src/index.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/index.js"]();
/******/ 	
/******/ })()
;
```

可以看到，打包后的代码中 `eval` 输出部分的 *var* 已经变成了 *const*。

### 2、编写异步 loader

上面实现的 loader 是一个同步 loader，在处理完源码后用 return 返回。

下面来实现一个异步 loader：

```js
module.exports = function (source) {
  const callback = this.async()

  // 由于有 3 秒延迟，所以打包时需要 3+ 秒的时间
  setTimeout(() => {
    callback(null, `${source.replace(/;/g, '')}`)
  }, 3000)
}
```

异步 loader 需要调用 webpack 的 `async()` 生成一个 *callback*，它的第一个参数是 *error*，这里可设为 *null*，第二个参数就是处理后的源码。当异步处理完源码后，调用 *callback* 即可。

调用同步 loader 的打包时间：

<img src="http://tva1.sinaimg.cn/large/0068vjfvgy1gwoxmbdi7sj30qi0aqq6p.jpg" width="500" referrerPolicy="no-referrer" />

调用异步 loader 的打包时间：

<img src="http://tva1.sinaimg.cn/large/0068vjfvgy1gwoxdovkwhj30t40augpq.jpg" width="500" referrerPolicy="no-referrer" />

可以看到延迟了 3 秒，说明异步 loader 生效了。

## 二、插件的实现

### 1、插件的组成

webpack 插件由以下组成：

- 一个 JavaScript 命名函数。
- 在插件函数的 prototype 上定义一个 `apply` 方法。
- 指定一个绑定到 webpack 自身的事件钩子。
- 处理 webpack 内部实例的特定数据。
- 功能完成后调用 webpack 提供的回调。

### 2、创建插件

#### 2-1、老版的写法 webpack <v5

插件是由「具有 `apply` 方法的 prototype 对象」所实例化出来的。这个 `apply` 方法在安装插件时，会被 *webpack compiler* 调用一次。apply 方法可以接收一个 *webpack compiler* 对象的引用，从而可以在回调函数中访问到 *compiler* 对象。一个简单的插件结构如下：

```js
// 一个 JavaScript 命名函数
function HelloWorldPlugin() {}

// 在插件函数的 prototype 上定义一个 apply 方法
HelloWorldPlugin.prototype.apply = function (compiler) {
  // 指定一个挂载到 webpack 自身的事件钩子
  compiler.plugin(
    'done',
    function (compilation /* 处理 webpack 内部实例的特定数据 */, callback) {
      console.log('Hello World!')

      // 功能完成后调用 webpack 提供的回调
      callback()
    }
  )
}

module.exports = HelloWorldPlugin
```

上面代码中，

- [compiler](https://www.webpackjs.com/api/compiler-hooks/) 模块扩展自 *Tapable* 类，*compiler* 对象包含了 webpack 环境所有的配置信息，在启动 webpack 时被实例化，可理解为 webpack 实例，用来注册和调用插件。

- [compilation](https://www.webpackjs.com/api/compilation-hooks/) 模块也扩展自 *Tapable* 类，*Compilation* 对象包含了当前的模块资源、编译生成资源、变化的文件等，当 webpack 以开发模式运行时，每检测到一个文件变化，一次新的 *Compilation* 将被创建。*Compilation* 对象也提供了很多事件回调供插件做扩展。通过 *Compilation* 也能读取到 *Compiler* 对象。

**Compiler 和 Compilation 的区别：**

*Compiler* 代表了整个 Webpack 从启动到关闭的生命周期，而 *Compilation* 只是代表了一次新的编译。

#### 2-2、新写法 webpack >=v5

```js
class HelloWorldPlugin {
  apply(compiler) {
    // 指定一个挂载到 webpack 自身的事件钩子
    compiler.hooks.done.tap('HelloWorldPlugin', (compilation, callback) => {
      console.log('Hello World!')

      // 功能完成后调用 webpack 提供的回调
      callback()
    })
  }
}

module.exports = HelloWorldPlugin
```

新的 webpack 需要使用 `compiler.hooks` 的写法，[点击查看 compiler 钩子。](https://www.webpackjs.com/api/compiler-hooks/)

### 3、使用插件

```js
// webpack.config.js

var HelloWorldPlugin = require('hello-world')

var webpackConfig = {
  // ... 这里是其他配置 ...
  plugins: [
    new HelloWorldPlugin({options: true})
  ]
}
```

### 4、插件实现示例

这里写一个名为 *EndWebpackPlugin* 的插件，作用是在 Webpack 即将退出时再附加一些额外的操作，例如 Webpack 成功编译和输出了文件后执行发布操作把输出的文件上传到服务器。同时该插件还能区分 Webpack 构建是否执行成功。

- **创建插件：**

*老版的写法：*

```js
// src/plugin1.js

function Plugin1(options) {}

// 在插件函数的 prototype 上定义一个 apply 方法
Plugin1.prototype.apply = function (compiler) {
  // 所有文件资源经过不同的 loader 处理后触发这个事件
  compiler.plugin('emit', function (compilation, callback) {
    // 获取打包后的 JS 文件名
    const filename = compiler.options.output.filename
    // 生成一个 index.html 并引入打包后的 JS 文件
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script src="${filename}"></script>
</head>
<body>

</body>
</html>`
    // 所有处理后的资源都放在 compilation.assets 中
    // 添加一个 index.html 文件
    compilation.assets['index.html'] = {
      source: function () {
        return html
      },
      size: function () {
        return html.length
      }
    }

    // 功能完成后调用 webpack 提供的回调
    callback()
  })
}

module.exports = Plugin1
```

*新版的写法：*

```js
// src/plugin1.js

class Plugin1 {
  apply(compiler) {
    compiler.hooks.emit.tap('Plugin1', (compilation) => {
      // 获取打包后的 JS 文件名
      const filename = compiler.options.output.filename
      // 生成一个 index.html 并引入打包后的 JS 文件
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script src="${filename}"></script>
</head>
<body>
    
</body>
</html>`
      // 所有处理后的资源都放在 compilation.assets 中
      // 添加一个 index.html 文件
      compilation.assets['index.html'] = {
        source: function () {
          return html
        },
        size: function () {
          return html.length
        }
      }

      // 功能完成后调用 webpack 提供的回调
      // callback()
    })
  }
}

module.exports = Plugin1
```

- **使用插件：**

```js
// webpack.config.js

const Plugin1 = require('./src/plugin1')

module.exports = {
  // ...
  plugins: [
    new Plugin1(),
    // 也可以这么写 ↓
    // 在初始化 EndWebpackPlugin 时传入了两个参数，分别是在成功时的回调函数和失败时的回调函数
    new Plugin1(
      () => {
        // Webpack 构建成功，并且文件输出了后会执行到这里，在这里可以做发布文件操作
      },
      (err) => {
        // Webpack 构建失败，err 是导致错误的原因
        console.error(err)
      }
    )
  ]
}
```

- **运行结果：**

<img src="http://tva1.sinaimg.cn/large/0068vjfvgy1gwpegm7qebj314g0ms7ft.jpg" width="700" referrerPolicy="no-referrer" />

目录文件：

```diff
  |- /dist
    |- bundle.js
+   |- index.html
```

生成一个 *index.html* 并引入打包后的 JS 文件：

```html
<!-- dist/index.html -->

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script src="bundle.js"></script>
</head>
<body>
    
</body>
</html>
```
