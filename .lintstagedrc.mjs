import { createChunkedLintStagedConfig } from '@jankrajewskiit/configs/lint-staged';

export default createChunkedLintStagedConfig({
  ignorePaths: [/^src\/styles\/(?:styles\.css$|components\/)/u],
});
