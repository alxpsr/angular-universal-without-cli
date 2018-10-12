const path = require('path');
const webpack = require('webpack');
const AngularCompilerPlugin = require('@ngtools/webpack').AngularCompilerPlugin;
let HtmlWebpackPlugin = require('html-webpack-plugin');
let helpers = require('./helpers/helpers');

function isDevMode(env) {
  if (!env) return false;
  return env.trim() === 'dev';
}

module.exports = {
  devtool: 'source-map',
  watch: isDevMode(process.env.ENV),
  entry: {
    main: './src/main.ts',
    polyfills: './src/polyfills.ts'
  },
  resolve: { 
    extensions: ['.js', '.ts'],
    alias: {
      crypto: require.resolve("crypto-browserify"),
      src: helpers.root('src'),
    },
    modules: ["node_modules"]
  },
  output: {
    path: path.join(__dirname, 'dist', 'browser'),
    filename: '[name].js',
    chunkFilename: '[id].browser.js',
  },
  module: {
    rules: [
      {
        test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
        loader: '@ngtools/webpack'
      },
      { test: /\.html$/, loader: 'html-loader', options: { minimize: true, removeAttributeQuotes: false, caseSensitive: true, customAttrSurround: [[/#/, /(?:)/], [/\*/, /(?:)/], [/\[?\(?/, /(?:)/]], customAttrAssign: [/\)?\]?=/] } },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader"
        ]
      },
      {
        test: /\.(scss|sass)$/,
        use: [
          "to-string-loader",
          "css-loader",
          "resolve-url-loader",
          {
            loader: 'sass-loader',
            options: {
              includePath: ['.']
            }
          }
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|otf|ttf|eot|ico)([\?]?.*)$/,
        use: 'url-loader?name=[path][name].[hash].[ext]&limit=4096'
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|otf|ttf|eot|ico)([\?]?.*)$/,
        include: /\/node_modules\//,
        use: 'file-loader?name=[1].[ext]&regExp=node_modules/(.*)'
      }
    ]
  },
  node: {
    crypto: true, 
    stream: true,
  },
  optimization: {
    minimize: !isDevMode(process.env.ENV),
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: "initial",
          minChunks: 2,
          name: "vendor",
          test: /node_modules/,
        },
        common: {
          chunks: "initial",
          minChunks: 2,
          name: "common"
        }
      }
    }
  },
  plugins: [
    // Build all App
    new AngularCompilerPlugin({
      entryModule: __dirname + "/src/app/app.module#AppModule",
      mainPath: __dirname + '/src/main.ts',
      tsConfigPath: './tsconfig.app.json',
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      chunks: ['main', 'polyfills', 'runtime'],
      chunksSortMode: sortChunk(['runtime', 'polyfills', 'main'])
    }),
  ],
}

function sortChunk(packages) {
  return function sort(a, b) {
    if (packages.indexOf(a.names[0]) > packages.indexOf(b.names[0])) return 1;
    if (packages.indexOf(a.names[0]) < packages.indexOf(b.names[0])) return -1;
    return 0;
  }
}
