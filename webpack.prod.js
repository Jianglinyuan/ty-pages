const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const glob = require('glob')

const entries = getEntry('src/page/*', 'src/page/')
const HtmlWebpackPlugins = []

function getEntry(globPath, pathDir) {
  var files = glob.sync(globPath)
  var entries = {}, dirname, basename, pathname, extname
  console.log(files)
  files.forEach(entry => {
    dirname = path.dirname(entry)
    extname = path.extname(entry)
    basename = path.basename(entry, extname)
    pathname = path.join(dirname, basename)
    pathname = pathDir ? pathname.replace(new RegExp('^' + pathDir), '') : pathname

    entries[pathname] = ['babel-polyfill', path.resolve(__dirname, './' + entry)]
  })
  return entries
}

Object.keys(entries).forEach(item => {
  const config = {
    filename: './' + item + '.html', //生成的html存放路径，相对于path
    template: './src/page/' + item + '/index.html', //html模板路径
    inject: 'body', //js插入的位置，true/'head'/'body'/false
    hash: true, //为静态资源生成hash值
    chunks: ['vendors', item],//需要引入的chunk，不配置就会引入所有页面的资源
    minify: { //压缩HTML文件
      removeComments: true, //移除HTML中的注释
      collapseWhitespace: false //删除空白符与换行符
    }
  }
  HtmlWebpackPlugins.push(new HtmlWebpackPlugin(config))
})

// console.log(entries)

module.exports = {
  // entry: {
  //   'app1': path.resolve(__dirname, './src/page/app1'),
  //   'app2': path.resolve(__dirname, './src/page/app2')
  // },
  entry: entries,
  output: {
    path: path.resolve(__dirname, './build'),
    publicPath: '/',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['babel-preset-env']
          }
        }
      },
      {
        test: /\.(css|sass|scss)$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [
            {
              loader: 'css-loader'
            },
            {
              loader: 'sass-loader'
            },
            {
              loader: 'postcss-loader',
              options: {
                config: {
                  path: './postcss.config.js' //其实默认情况可以不要
                }
              }
            }
          ]
        })
      },
      {
        test: /\.html$/,
        use: [{
          loader: 'html-loader',
          options: {
            minimize: false
          }
        }]
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('./[name].css'),
    new CommonsChunkPlugin({
      name: 'vendors', // 将公共模块提取，生成名为`vendors`的chunk
      chunks: Object.keys(entries),
      minChunks: Object.keys(entries).length
    }),
    new UglifyJsPlugin({ //压缩代码
      compress: {
        warnings: false
      },
      except: ['$super', '$', 'exports', 'require'] //排除关键字
    }),
    ...HtmlWebpackPlugins
  ]

}