import { lstat, mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

import ts from 'typescript';
import { preprocessCSS, resolveConfig } from 'vite';

import cssModules from '../css-modules.config.mjs';

const PRESET_ENTRIES = {
  grid: ['components/data/DataGrid.tsx', 'components/data/ColumnManager.tsx'],
  lists: ['components/data/VirtualList.tsx', 'components/data/VirtualTable.tsx'],
  query: ['components/patterns/QueryBuilder.tsx'],
  charts: ['charts/TradingViewChart.tsx'],
};

const root = await realpath(resolve(import.meta.dirname, '..'));
const source = resolve(root, 'src');
const target = resolve(root, 'dist/styles');
const config = await resolveConfig({ configFile: false, root, css: { modules: cssModules } }, 'build');
const modules = new Map();
const sources = new Map();
const posix = (path) => path.replaceAll('\\', '/');
const assetPath = (path) => resolve(target, 'modules', relative(source, path)).replace(/\.module\.css$/u, '.css');
const importPath = (from, to) => {
  const path = posix(relative(dirname(from), to));
  return path.startsWith('.') ? path : './' + path;
};
const collect = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Styles packaging does not accept symbolic links: ' + path);
    if (entry.isDirectory()) await collect(path);
    else if (entry.name.endsWith('.module.css')) {
      const css = await readFile(path, 'utf8');
      const dependencies = [
        ...css.matchAll(/(?:composes:[^;]+?from\s+|:import\()\s*['"]([^'"]+\.module\.css)['"]/gu),
      ].map((match) => resolve(dirname(path), match[1]));
      modules.set(path, { css, dependencies: [...new Set(dependencies)] });
    } else if (/\.tsx?$/u.test(entry.name)) sources.set(path, await readFile(path, 'utf8'));
  }
};

await collect(source);
if ((await realpath(source)) !== source || (await realpath(dirname(target))) !== dirname(target)) {
  throw new Error('Styles packaging does not accept symbolic-link roots');
}
try {
  if ((await lstat(target)).isSymbolicLink()) throw new Error('Styles target must not be a symbolic link');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await mkdir(target, { recursive: true });
for (const [path, { css, dependencies }] of modules) {
  const start = '/*! velvet-data-module-start */';
  const end = '/*! velvet-data-module-end */';
  // Keep composed dependencies as imports so each published module owns only its rules.
  const result = await preprocessCSS(start + '\n' + css + '\n' + end, path, config);
  const from = result.code.lastIndexOf(start);
  const to = result.code.lastIndexOf(end);
  if (from < 0 || to < from) throw new Error('CSS module boundaries were lost: ' + path);
  const output = assetPath(path);
  const imports = dependencies.map((dependency) => {
    if (!modules.has(dependency)) throw new Error('Missing CSS module: ' + dependency);
    return `@import url('${importPath(output, assetPath(dependency))}');`;
  });
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, imports.join('\n') + '\n' + result.code.slice(from + start.length, to).trim() + '\n');
}

const localModule = (from, specifier) => {
  if (!specifier.startsWith('.')) return undefined;
  const path = resolve(dirname(from), specifier);
  if (modules.has(path)) return path;
  const stem = path.replace(/\.[cm]?jsx?$/u, '');
  return [path, stem + '.ts', stem + '.tsx', resolve(path, 'index.ts'), resolve(path, 'index.tsx')].find((candidate) =>
    sources.has(candidate),
  );
};
const importsBySource = new Map();
for (const [path, sourceText] of sources) {
  const syntax = ts.createSourceFile(path, sourceText, ts.ScriptTarget.Latest, true);
  const dependencies = new Set();
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      !node.isTypeOnly &&
      !node.importClause?.isTypeOnly &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const dependency = localModule(path, node.moduleSpecifier.text);
      if (dependency) dependencies.add(dependency);
    }
    ts.forEachChild(node, visit);
  };
  visit(syntax);
  importsBySource.set(path, dependencies);
}
const stylesFor = (entries) => {
  const visited = new Set();
  const styles = new Set();
  const visit = (path) => {
    if (visited.has(path)) return;
    visited.add(path);
    if (modules.has(path)) styles.add(path);
    else for (const dependency of importsBySource.get(path) ?? []) visit(dependency);
  };
  for (const entry of entries) {
    const path = resolve(source, entry);
    if (!sources.has(path)) throw new Error('Missing style preset entry: ' + entry);
    visit(path);
  }
  return [...styles].sort();
};

await mkdir(resolve(target, 'presets'), { recursive: true });
for (const [preset, entries] of Object.entries(PRESET_ENTRIES)) {
  const path = resolve(target, 'presets', preset + '.css');
  const imports = stylesFor(entries).map((module) => `@import url('${importPath(path, assetPath(module))}');`);
  await writeFile(path, imports.join('\n') + '\n');
}
await writeFile(
  resolve(target, 'styles.css'),
  Object.keys(PRESET_ENTRIES)
    .map((preset) => `@import url('./presets/${preset}.css');`)
    .join('\n') + '\n',
);
