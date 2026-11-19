import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { VueLoaderPlugin } from 'vue-loader'
import StetCSSPlugin from '@stet-css/webpack'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  entry: './src/index.js',
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    path: join(__dirname, 'dist'),
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: join(__dirname, 'src/index.html')
    }),
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    }),
    new StetCSSPlugin(),
    new VueLoaderPlugin()
  ],
  devServer: {
    watchFiles: ['src/**/*']
  },
  module: {
    rules: [
      { test: /\.svg/, type: 'asset/resource' },
      { test: /\.vue$/, loader: 'vue-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  }
}
