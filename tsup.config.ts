import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'utils/index': 'src/utils/index.ts',
    'errors/index': 'src/errors/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'node18',
  outDir: 'dist',
  outExtension: ({ format }) => ({
    js: format === 'cjs' ? '.cjs' : '.js',
  }),
  banner: {
    js: '// vidbreak — https://github.com/vidbreak/vidbreak',
  },
});
