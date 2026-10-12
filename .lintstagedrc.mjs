import { relative } from 'node:path';

const CHUNK_SIZE = 25;
const IGNORED_PATH = /^src\/styles\/(?:styles\.css$|components\/)/u;

const toRelative = (file) => relative(process.cwd(), file).replaceAll('\\', '/');

const chunk = (items) =>
  Array.from({ length: Math.ceil(items.length / CHUNK_SIZE) }, (_, index) =>
    items.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
  );

const runChunked = (tool, files) =>
  chunk(files).map((group) => `${tool} ${group.map((file) => `"${file}"`).join(' ')}`);

const createTask =
  (...tools) =>
  (files) => {
    const owned = files.map(toRelative).filter((file) => !IGNORED_PATH.test(file));
    return tools.flatMap((tool) => runChunked(tool, owned));
  };

export default {
  '*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}': createTask('eslint --fix --no-warn-ignored', 'prettier --write'),
  '*.css': createTask('stylelint --fix', 'prettier --write'),
  '*.{json,md,yml,yaml,html}': createTask('prettier --write'),
};
