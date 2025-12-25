module.exports = {
  devtool: 'inline-source-map',
  externals: {
    '@assets/selectors': '@assets/selectors'
  },
  module: {
    rules: [
      {
        // includes, excludes are in tsconfig.json
        test: /\.ts?$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  },
  output: {
    filename: 'bundle.js'
  }
}