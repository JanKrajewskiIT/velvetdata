import { createSolidLibViteConfig } from '@jankrajewskiit/configs/vite';
import { defineConfig } from 'vite';

export default defineConfig(async () =>
  createSolidLibViteConfig(
    {
      build: {
        lib: {
          entry: { index: 'src/index.ts', tradingview: 'src/tradingview.ts' },
        },
      },
    },
    {
      fileName: 'velvet-data',
      externalizeFromPackageJson: true,
      dts: { tsconfigPath: './tsconfig.app.json' },
    },
  ),
);
