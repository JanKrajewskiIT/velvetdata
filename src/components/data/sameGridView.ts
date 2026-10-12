import { isQueryGroup, type QueryGroup, type QueryNode } from '../patterns/queryModel';
import { sameColumnState } from './columnState';
import type { GridViewState } from './gridViewTypes';

const sameQueryNode = (a: QueryNode, b: QueryNode): boolean => {
  if (isQueryGroup(a)) return isQueryGroup(b) && sameQuery(a, b);
  return !isQueryGroup(b) && a.field === b.field && a.op === b.op && a.value === b.value;
};

const sameQuery = (a: QueryGroup | undefined, b: QueryGroup | undefined): boolean =>
  a === b ||
  (!!a &&
    !!b &&
    a.combinator === b.combinator &&
    a.rules.length === b.rules.length &&
    a.rules.every((node, index) => {
      const other = b.rules[index];
      return !!other && sameQueryNode(node, other);
    }));

export const sameGridView = (a: GridViewState, b: GridViewState): boolean =>
  a.search === b.search &&
  a.sort?.key === b.sort?.key &&
  a.sort?.dir === b.sort?.dir &&
  sameColumnState(a.columns, b.columns) &&
  sameQuery(a.query, b.query) &&
  Object.keys(a.widths).length === Object.keys(b.widths).length &&
  Object.entries(a.widths).every(([key, width]) => Object.hasOwn(b.widths, key) && b.widths[key] === width);
