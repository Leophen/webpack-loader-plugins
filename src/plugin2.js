class Plugin2 {
  apply(compiler) {
    compiler.hooks.emit.tap('Plugin2', (compilation) => {
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

module.exports = Plugin2
