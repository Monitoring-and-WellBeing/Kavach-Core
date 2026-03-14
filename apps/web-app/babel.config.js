// Babel config — used by both Next.js build and Jest.
// next/babel includes @babel/preset-react and @babel/preset-typescript.
// CommonJS module transform is only enabled in the test environment so that
// Jest can consume the output, while the production build keeps ESM.
module.exports = {
  presets: [
    [
      'next/babel',
      {
        'preset-env': {
          targets: { node: 'current' },
          modules: process.env.NODE_ENV === 'test' ? 'commonjs' : false,
        },
      },
    ],
  ],
}
