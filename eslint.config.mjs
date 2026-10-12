import {
  buildAllowEmptyInterfaceConfig,
  buildLiteralI18nKeyRule,
  buildRuleOverrideConfig,
  buildSolidHtmlForCompatConfig,
  createEslintConfig,
} from '@jankrajewskiit/configs/eslint';

export default createEslintConfig({
  tsconfigRootDir: import.meta.dirname,
  extraConfigs: [
    buildRuleOverrideConfig({
      name: 'data/literal-i18n-keys',
      files: ['src/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'no-restricted-syntax': buildLiteralI18nKeyRule({ staticFunction: 'translate' }),
      },
    }),
    buildSolidHtmlForCompatConfig(['src/**/*.tsx']),
    buildAllowEmptyInterfaceConfig(['src/i18n/augment.ts']),
  ],
});
