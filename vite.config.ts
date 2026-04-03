import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'intk',
      fileName: (format) => {
        if (format === 'es') {
          return 'intake.esm.js';
        }
        return 'intake.js'; // UMD format
      },
      formats: ['umd', 'es'], // UMD for browsers, ES for modern bundlers
    },
    outDir: 'dist',
    // Target modern browsers - no ES5 transpilation needed
    target: 'es2015', // ES2015+ for modern browsers
    emptyOutDir: false, // Don't clear dist - keep GTM build files
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.log for debugging
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        globals: {},
      },
    },
  },
});

