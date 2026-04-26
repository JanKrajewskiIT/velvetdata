import { createSolidLibViteConfig } from '@jankrajewskiit/configs/vite';
import { defineConfig } from 'vite';

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
