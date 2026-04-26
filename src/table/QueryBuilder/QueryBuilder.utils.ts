import type {
  QueryBuilderCombinator,
  QueryBuilderField,
  QueryBuilderOperator,
  QueryBuilderRule,
  QueryBuilderValue,
} from './QueryBuilder';

export const FALLBACK_OPERATORS: QueryBuilderOperator[] = ['contains', 'equals', 'notEquals', 'isEmpty', 'isNotEmpty'];
export const NUMBER_OPERATORS: QueryBuilderOperator[] = [
  'equals',
  'notEquals',
  'gt',
  'gte',
  'lt',
  'lte',
  'isEmpty',
  'isNotEmpty',
];
export const SELECT_OPERATORS: QueryBuilderOperator[] = ['equals', 'notEquals', 'isEmpty', 'isNotEmpty'];

export const getDefaultOperators = (field?: QueryBuilderField): QueryBuilderOperator[] => {
  if (!field) return FALLBACK_OPERATORS;
  if (field.operators && field.operators.length > 0) return [...field.operators];
  if (field.type === 'number') return NUMBER_OPERATORS;
  if (field.type === 'select') return SELECT_OPERATORS;
  return FALLBACK_OPERATORS;
};

export const createRuleId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export const requiresValue = (operator: QueryBuilderOperator) => operator !== 'isEmpty' && operator !== 'isNotEmpty';

export const createQueryBuilderRule = (field: QueryBuilderField): QueryBuilderRule => ({
  id: createRuleId(),
  fieldKey: field.key,
  operator: getDefaultOperators(field)[0] ?? 'equals',
  value: '',
});

export const appendQueryBuilderRule = (value: QueryBuilderValue, field: QueryBuilderField): QueryBuilderValue => ({
  ...value,
  rules: [...value.rules, createQueryBuilderRule(field)],
});

export const updateQueryBuilderCombinator = (
  value: QueryBuilderValue,
  combinator: QueryBuilderCombinator,
): QueryBuilderValue => ({
  ...value,
  combinator,
});

export const replaceQueryBuilderRules = (value: QueryBuilderValue, rules: QueryBuilderRule[]): QueryBuilderValue => ({
  ...value,
  rules,
});

export const patchQueryBuilderRule = (
  value: QueryBuilderValue,
  ruleId: string,
  next: Partial<QueryBuilderRule>,
): QueryBuilderValue =>
  replaceQueryBuilderRules(
    value,
    value.rules.map((rule) => (rule.id === ruleId ? { ...rule, ...next } : rule)),
  );

export const removeQueryBuilderRuleById = (value: QueryBuilderValue, ruleId: string): QueryBuilderValue =>
  replaceQueryBuilderRules(
    value,
    value.rules.filter((rule) => rule.id !== ruleId),
  );

export const moveQueryBuilderRuleById = (
  value: QueryBuilderValue,
  ruleId: string,
  direction: -1 | 1,
): QueryBuilderValue => {
  const index = value.rules.findIndex((rule) => rule.id === ruleId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= value.rules.length) return value;
  const nextRules = [...value.rules];
  const [movedRule] = nextRules.splice(index, 1);
  if (!movedRule) return value;
  nextRules.splice(nextIndex, 0, movedRule);
  return replaceQueryBuilderRules(value, nextRules);
};
