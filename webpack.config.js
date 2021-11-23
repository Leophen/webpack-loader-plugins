const path = require('path')
const Plugin1 = require('./src/plugin1')
const Plugin2 = require('./src/plugin2')

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
          },
          {
            loader: path.resolve('./src/async-loader.js')
          }
        ]
      }
    ]
  },
  plugins: [
    // new Plugin1(), // webpack 5 之前可用
    new Plugin2() // webpack 5 之后 compiler.hooks 的写法
  ]
}
