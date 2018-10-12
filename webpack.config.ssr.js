const path = require('path');
const webpack = require('webpack');
const AngularCompilerPlugin = require('@ngtools/webpack').AngularCompilerPlugin;
let nodeExternals = require('webpack-node-externals');
let helpers = require('./helpers/helpers');

module.exports = {
    entry: {
        main: './src/main.server.ts',
    },
    resolve: {
        extensions: ['.js', '.ts'],
        alias: {
            src: helpers.root('src'),
        }
    },
    target: 'node', // в браузерной части это не нужно | in browser-build you don't need it
    output: {
        path: path.join(__dirname, 'dist', 'server'),
        filename: '[name].js',
        libraryTarget: "commonjs",
        chunkFilename: '[id].ssr.js'
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
    plugins: [
        // Build all App
        new AngularCompilerPlugin({
            entryModule: __dirname + "/src/app/app.server.module#AppServerModule",
            mainPath: __dirname + '/src/main.server.ts',
            tsConfigPath: './tsconfig.server.json',
            platform: 1,
            basePath: __dirname + "/src",
            skipCodeGeneration: false
        })
    ],
    // this makes sure we include node_modules and other 3rd party libraries
    // офиц. гайд говорит делать так: externals: [/(node_modules|main\..*\.js)/],
    // но почему то это не работает
    // ==== translate
    // official angular-guide provide this: externals: [/(node_modules|main\..*\.js)/],
    // BUT this doesn't work. I don't know why :(
    externals: [nodeExternals()], // это нужно только для серверной части
    node: {
        __filename: true,
        __dirname: true
    },
}
