import { cellText, rowValue } from '@jankrajewskiit/ui/common';

import type { QueryFieldType, QueryGroup, QueryRule } from '../patterns/queryModel';
import { VALUELESS_OPS } from '../patterns/queryModel';
import { queryDate } from './queryDate';
import { queryNumber } from './queryNumber';

type QueryNode = QueryRule | QueryGroup;

const isGroup = (node: QueryNode): node is QueryGroup => 'rules' in node;

const isActive = (node: QueryNode): boolean =>
  isGroup(node) ? node.rules.some(isActive) : VALUELESS_OPS.includes(node.op) || node.value !== '';

/** Number of rules that currently constrain the result. */
export const countActiveRules = (node: QueryNode): number => {
  if (isGroup(node)) return node.rules.reduce((n, rule) => n + countActiveRules(rule), 0);
  return isActive(node) ? 1 : 0;
};

const matchesRule = (
  rule: QueryRule,
  row: object,
  getValue?: (key: string) => unknown,
  fieldType?: QueryFieldType,
): boolean => {
  const value = getValue ? getValue(rule.field) : rowValue(row, rule.field);
  const text = cellText(value).toLowerCase();
  const operand = cellText(rule.value).toLowerCase();
  const number = queryNumber(value);
  const operandNumber = queryNumber(rule.value);
  const isNumber = fieldType === 'number' || typeof value === 'number';
  const isBlank = value == null || value === '';
  switch (rule.op) {
    case 'contains':
      return text.includes(operand);
    case 'not_contains':
      return !text.includes(operand);
    case 'eq':
      return isNumber
        ? number !== undefined && operandNumber !== undefined && number === operandNumber
        : text === operand;
    case 'neq':
      return isNumber
        ? number !== undefined && operandNumber !== undefined && number !== operandNumber
        : text !== operand;
    case 'starts':
      return text.startsWith(operand);
    case 'ends':
      return text.endsWith(operand);
    case 'empty':
      return isBlank;
    case 'not_empty':
      return !isBlank;
    case 'gt':
      return number !== undefined && operandNumber !== undefined && number > operandNumber;
    case 'gte':
      return number !== undefined && operandNumber !== undefined && number >= operandNumber;
    case 'lt':
      return number !== undefined && operandNumber !== undefined && number < operandNumber;
    case 'lte':
      return number !== undefined && operandNumber !== undefined && number <= operandNumber;
    case 'on':
    case 'before':
    case 'after': {
      const day = queryDate(value);
      const operandDay = queryDate(rule.value);
      if (day === undefined || operandDay === undefined) return false;
      if (rule.op === 'on') return day === operandDay;
      return rule.op === 'before' ? day < operandDay : day > operandDay;
    }
    case 'true':
      return value === true;
    case 'false':
      return value === false;
    default:
      return false;
  }
};

/** Whether `row` satisfies every (and) or any (or) active rule of the query tree. */
export const matchesQuery = (
  node: QueryNode,
  row: object,
  getValue?: (key: string) => unknown,
  fieldType?: (key: string) => QueryFieldType | undefined,
): boolean => {
  if (!isGroup(node)) return matchesRule(node, row, getValue, fieldType?.(node.field));
  const active = node.rules.filter(isActive);
  if (!active.length) return true;
  return node.combinator === 'or'
    ? active.some((r) => matchesQuery(r, row, getValue, fieldType))
    : active.every((r) => matchesQuery(r, row, getValue, fieldType));
};
