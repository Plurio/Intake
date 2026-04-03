module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          // Modern browsers - no IE11 support
          browsers: ['> 0.5%', 'last 2 versions', 'not dead']
        },
        modules: false, // Keep ES modules for Vite
        useBuiltIns: false, // No polyfills needed for modern browsers
        corejs: false,
        loose: false,
        bugfixes: true
      }
    ]
  ],
  plugins: [
    // No ES5-specific plugins needed for modern browsers
  ]
};

