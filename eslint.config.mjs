import { createEslintConfig } from '@jankrajewskiit/configs/eslint';

export default createEslintConfig({
  tsconfigRootDir: import.meta.dirname,
  extraConfigs: [
    {
      rules: {
        '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'with-single-extends' }],
      },
    },
  ],
});
