// Babel config for Jest to transform ESM modules
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current',
      },
      modules: 'commonjs', // Transform ESM to CommonJS for Jest
    }],
  ],
}
