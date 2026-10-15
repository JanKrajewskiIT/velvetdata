import { createSolidLibViteConfig } from '@jankrajewskiit/configs/vite';
import { defineConfig } from 'vite';

import cssModules from './css-modules.config.mjs';

export default defineConfig(async () =>
  createSolidLibViteConfig(
    {
      css: { modules: cssModules },
      build: {
        lib: {
          entry: { index: 'src/index.ts', bare: 'src/bare.ts', tradingview: 'src/tradingview.ts' },
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
