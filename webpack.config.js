const { resolve } = require('path');

const { CheckerPlugin } = require('awesome-typescript-loader');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');

module.exports = {
  mode: 'development',

  entry: './example/index.ts',
  output: {
    filename: 'bundle.js',
    path: resolve(__dirname, 'dist'),
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': resolve('src'), // 通过这里的配置，@ 符号等同于src
    },
  },

  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            [
              '@babel/preset-typescript',
              {
                allExtensions: true,
              },
            ],
          ],
        },
      },
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            [
              '@babel/preset-typescript',
              {
                allExtensions: true,
              },
            ],
          ],
        },
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
          'file-loader?hash=sha512&digest=hex&name=images/[hash].[ext]',
          'image-webpack-loader?bypassOnDebug&optipng.optimizationLevel=7&gifsicle.interlaced=false',
        ],
      },
      {
        // 处理less资源
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'scss-loader'],
      },
      {
        // 处理css资源
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        // 处理图片资源
        test: /\.(jpg|png|gif)$/,
        loader: 'url-loader',
        options: {
          limit: 8 * 1024,
          name: '[hash:10].[ext]',
          // 关闭es6模块化 esModule: false, outputPath: 'imgs'
        },
      },
      {
        // 处理html中img资源
        test: /\.html$/,
        loader: 'html-loader',
      },
    ],
  },
  plugins: [
    new CheckerPlugin(),
    new ProgressBarPlugin(),
    new HtmlWebpackPlugin({
      template: `${__dirname}/example/index.html`,
      filename: 'index.html',
      inject: 'body',
      minify: {
        removeAttributeQuotes: true, // 删除属性的双引号，除了一些特殊的删除不了以外都能删除
        collapseWhitespace: true, // 折叠空行将所有代码变成一行
        removeComments: true, // 移除注释
      },
      hash: true, // 给打包后在模板中引入的文件名生成hash戳，防止缓存
    }),
  ],
  devServer: {
    contentBase: resolve(__dirname, 'dist'),
    compress: true,
    port: 8080,
    open: true,
  },
};
