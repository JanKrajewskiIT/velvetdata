import { createHash } from 'node:crypto';
import { relative } from 'node:path';

/** @satisfies {import('vite').CSSModulesOptions} */
const cssModules = {
  generateScopedName: (name, filename) => {
    const source = relative(import.meta.dirname, filename).replaceAll('\\', '/');
    const hash = createHash('sha256')
      .update(source + ':' + name)
      .digest('hex')
      .slice(0, 8);
    return `vdata-${name}_${hash}`;
  },
};

export default cssModules;
