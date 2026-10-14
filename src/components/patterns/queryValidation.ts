import { queryDate } from '../data/queryDate';
import { queryNumber } from '../data/queryNumber';
import {
  isQueryGroup,
  type QueryField,
  type QueryGroup,
  queryOperatorValues,
  type QueryRule,
  VALUELESS_OPS,
} from './queryModel';

export interface QueryIssue {
  ruleId: string;
  reason: 'unknown-field' | 'unsupported-operator' | 'invalid-value';
}

export const queryRuleIssue = (rule: QueryRule, fields: readonly QueryField[]): QueryIssue | undefined => {
  const field = fields.find((item) => item.key === rule.field);
  if (!field) return { ruleId: rule.id, reason: 'unknown-field' };
  if (!queryOperatorValues(field).includes(rule.op)) return { ruleId: rule.id, reason: 'unsupported-operator' };
  if (VALUELESS_OPS.includes(rule.op) || rule.value === '') return;
  const invalid =
    field.type === 'number'
      ? queryNumber(rule.value) === undefined
      : field.type === 'date'
        ? queryDate(rule.value) === undefined
        : field.type === 'select'
          ? !(field.options ?? []).some((option) => option.value === rule.value)
          : false;
  return invalid ? { ruleId: rule.id, reason: 'invalid-value' } : undefined;
};

export const validateQuery = (query: QueryGroup, fields: readonly QueryField[]): QueryIssue[] =>
  query.rules.flatMap((node) => {
    if (isQueryGroup(node)) return validateQuery(node, fields);
    const issue = queryRuleIssue(node, fields);
    return issue ? [issue] : [];
  });
