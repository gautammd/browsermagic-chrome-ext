const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    background: './background/background.js',
    content: './content/content.js',
    popup: './popup/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/[name].js',
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'assets', to: 'assets' },
        { from: 'popup/popup.html', to: 'popup/popup.html' },
        { from: 'popup/popup.css', to: 'popup/popup.css' },
        { from: 'services/*.js', to: 'services/[name][ext]' },
      ],
    }),
  ],
  optimization: {
    minimize: false
  }
};