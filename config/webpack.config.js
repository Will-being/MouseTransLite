const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    background: "./src/background.js",
    contentScript: "./src/contentScript.js",
    popup: "./src/popup.js",
  },
  output: {
    path: path.resolve(__dirname, "../build"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".json"],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "public/popup.html",
          to: "popup.html",
        },
        {
          from: "public/manifest.json",
          to: "manifest.json",
        },
        {
          from: "public/icons",
          to: "icons",
        },
        {
          from: "public/_locales",
          to: "_locales",
        },
        {
          from: "node_modules/tippy.js/dist/tippy.css",
          to: "tippy.css",
        },
      ],
    }),
  ],
  devtool: process.env.NODE_ENV === "production" ? false : "source-map",
  performance: {
    hints: false,
    maxAssetSize: 5000000,
    maxEntrypointSize: 5000000,
  },
};


