const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    background: './background/background.js',
    content: './content/content.js',
    popup: './popup/popup.jsx',
    sidebar: './sidebar/sidebar.jsx'
  },
  stats: {
    errorDetails: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'assets', to: 'assets' },
        { from: 'popup/popup.html', to: 'popup/popup.html' },
        { from: 'sidebar/sidebar.html', to: 'sidebar/sidebar.html' },
        { from: 'services/*.js', to: 'services/[name][ext]' },
      ],
    }),
  ],
  optimization: {
    minimize: false
  }
};