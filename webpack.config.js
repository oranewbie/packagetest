const path = require('path');
 
 module.exports = {
   entry: {
     index: ['@babel/polyfill', './test/index.js'],
   },
   output: {
     filename: 'bundle.js',
     path: path.join(__dirname, 'test'),
   },
   resolve: {
    extensions: ['.js', '.jsx'],
  },
   module: {
     rules: [
      {
        test: /\.(js|mjs|jsx|ts|tsx)?$/,
        exclude: [
          {
            and: [path.resolve(__dirname, "node_modules")],
          }
        ],
        loader: 'babel-loader',
        options: {
          presets: [
            '@babel/preset-env',
            '@babel/preset-react'
          ]
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ["file-loader?name=images/[name].[ext]"]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ["file-loader",]
      },
      {
        test: /\.md$/,
        use: 'raw-loader'
      }
     ],
   },
   plugins: [],
   devServer: {
     "allowedHosts": ["localhost", ".localhost"],
     devMiddleware: {
      publicPath: "/",
    },
    static: {
      // 기본값은 public
      directory: path.resolve(__dirname, "./test"),
    },
    host: "localhost",
    port: 3000,
    historyApiFallback: true,
   },
 };