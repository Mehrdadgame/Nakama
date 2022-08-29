const path = require("path");

module.exports = {
    entry: "./build/es6/main.js",
    target: "es5",
    module: {
        rules: [
            {
                test: /\.js$/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                },
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.js'],
    },
    output: { module: true, library: { type: "module" } }, experiments: { outputModule: true },
};