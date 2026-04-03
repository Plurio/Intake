import { defineConfig } from 'vite';
import path from 'path';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

const babelPlugin = babel({
  babelHelpers: 'bundled',
  extensions: ['.js', '.ts', '.tsx'],
  // Include source files only - no need to transpile node_modules for modern browsers
  include: [/src\/.*/],
  exclude: /node_modules/,
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        targets: {
          // ES5 syntax for GTM compiler compatibility
          // Not targeting IE11, but GTM compiler requires ES5 syntax
          chrome: '50', // Minimum version that still requires some ES5 transforms
          firefox: '50',
          safari: '10',
          edge: '12'
        },
        modules: false, // Keep ES modules for Rollup/Vite to handle
        useBuiltIns: false, // No polyfills needed
        corejs: false,
        // Force ES5 transpilation for GTM compiler compatibility
        forceAllTransforms: true,
        loose: false, // Use spec-compliant transforms
        bugfixes: true // Apply bugfixes for older environments
      }
    ]
  ],
  plugins: [
    // ES5 transpilation plugins for GTM compiler compatibility
    ['@babel/plugin-transform-block-scoping', { throwIfClosureRequired: false }],
    '@babel/plugin-transform-arrow-functions',
    '@babel/plugin-transform-template-literals',
    '@babel/plugin-transform-parameters',
    '@babel/plugin-transform-for-of',
    '@babel/plugin-proposal-optional-chaining'
  ],
  babelrc: false
});

export default defineConfig({
  plugins: [
    // CommonJS plugin for any CommonJS dependencies
    commonjs({
      transformMixedEsModules: true
    }),
    nodeResolve({
      // Resolve modules from node_modules
      preferBuiltins: false
    }),
    babelPlugin,
    // No post-processing needed for modern browsers
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'intk',
      fileName: () => 'intake.gtm.js',
      formats: ['umd'],
    },
    outDir: 'dist',
    // ES5 syntax for GTM compiler compatibility (no IE11 polyfills)
    emptyOutDir: false, // Don't clear dist - keep regular build files
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      // Ensure all dependencies are bundled
      output: {
        // Don't externalize anything - bundle everything
        globals: {}
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.log for debugging
      },
      format: {
        comments: false,
      },
    },
  },
});

