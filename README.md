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
