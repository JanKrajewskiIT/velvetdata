import { defineConfig } from 'vite';
import { createSolidLibViteConfig } from '@jankrajewskiit/configs/vite';

export default defineConfig(async () =>
  createSolidLibViteConfig(
    {},
    {
      fileName: 'velvet-data',
      externalPackages: ['solid-js', 'solid-icons', 'lightweight-charts', '@jankrajewskiit/ui'],
      dts: { tsconfigPath: './tsconfig.app.json' },
    },
  ),
);
