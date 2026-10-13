import { createSolidLibViteConfig } from '@jankrajewskiit/configs/vite';
import { defineConfig } from 'vite';

export default defineConfig(async () =>
  createSolidLibViteConfig(
    {
      build: {
        lib: {
          entry: { index: 'src/index.ts', tradingview: 'src/tradingview.ts' },
          cssFileName: 'velvet-data',
        },
      },
    },
    {
      fileName: 'velvet-data',
      dts: { tsconfigPath: './tsconfig.app.json' },
    },
  ),
);
