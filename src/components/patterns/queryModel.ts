import type { I18nKey } from '@jankrajewskiit/i18n';
import { createId } from '@jankrajewskiit/ui/common';

import { englishText, type StaticTranslate } from './englishText';

export interface QueryOperator {
  value: string;
  label: string;
}

type OperatorDefinition = { value: string } & ({ labelKey: I18nKey } | { symbol: string });

const IS_EMPTY = {
  value: 'empty',
  labelKey: 'velvetData.queryBuilder.operators.isEmpty',
} as const satisfies OperatorDefinition;
const IS = { value: 'eq', labelKey: 'velvetData.queryBuilder.operators.is' } as const satisfies OperatorDefinition;

const OPERATORS = {
  text: [
    { value: 'contains', labelKey: 'velvetData.queryBuilder.operators.contains' },
    { value: 'not_contains', labelKey: 'velvetData.queryBuilder.operators.notContains' },
    IS,
    { value: 'starts', labelKey: 'velvetData.queryBuilder.operators.startsWith' },
    { value: 'ends', labelKey: 'velvetData.queryBuilder.operators.endsWith' },
    IS_EMPTY,
    { value: 'not_empty', labelKey: 'velvetData.queryBuilder.operators.isNotEmpty' },
  ],
  number: [
    { value: 'eq', symbol: '=' },
    { value: 'neq', symbol: '≠' },
    { value: 'gt', symbol: '>' },
    { value: 'gte', symbol: '≥' },
    { value: 'lt', symbol: '<' },
    { value: 'lte', symbol: '≤' },
    IS_EMPTY,
  ],
  select: [IS, { value: 'neq', labelKey: 'velvetData.queryBuilder.operators.isNot' }, IS_EMPTY],
  date: [
    { value: 'on', labelKey: 'velvetData.queryBuilder.operators.isOn' },
    { value: 'before', labelKey: 'velvetData.queryBuilder.operators.isBefore' },
    { value: 'after', labelKey: 'velvetData.queryBuilder.operators.isAfter' },
    IS_EMPTY,
  ],
  boolean: [
    { value: 'true', labelKey: 'velvetData.queryBuilder.operators.isTrue' },
    { value: 'false', labelKey: 'velvetData.queryBuilder.operators.isFalse' },
  ],
} as const satisfies Record<string, readonly OperatorDefinition[]>;

export type QueryOperatorValue = (typeof OPERATORS)[keyof typeof OPERATORS][number]['value'];
export const QUERY_OPERATOR_VALUES: readonly string[] = Object.values(OPERATORS).flatMap((operators) =>
  operators.map((operator) => operator.value),
);

const COMBINATOR_LABEL_KEYS: Record<'and' | 'or', I18nKey> = {
  and: 'velvetData.queryBuilder.combinators.and',
  or: 'velvetData.queryBuilder.combinators.or',
};

export type QueryFieldType = keyof typeof OPERATORS;

export interface QueryField {
  key: string;
  label: string;
  /** @default 'text' */
  type?: QueryFieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** Limit the available operators to a subset supported by this field's type. */
  operators?: readonly QueryOperatorValue[];
}

export interface QueryRule {
  id: string;
  field: string;
  op: string;
  value: string;
}

export interface QueryGroup {
  id: string;
  combinator: 'and' | 'or';
  rules: Array<QueryRule | QueryGroup>;
}

export type QueryNode = QueryRule | QueryGroup;

/** Operators that need no operand. */
export const VALUELESS_OPS: readonly string[] = ['empty', 'not_empty', 'true', 'false'];

export const isQueryGroup = (node: QueryNode): node is QueryGroup => 'rules' in node;

const operatorDefinitions = (field: QueryField | undefined): readonly OperatorDefinition[] => {
  const defaults = OPERATORS[field?.type ?? 'text'];
  return field?.operators ? defaults.filter((operator) => field.operators?.includes(operator.value)) : defaults;
};

export const queryOperatorValues = (field: QueryField | undefined): string[] =>
  operatorDefinitions(field).map((operator) => operator.value);

export const operatorsFor = (field: QueryField | undefined, translate: StaticTranslate): QueryOperator[] =>
  operatorDefinitions(field).map((definition) => ({
    value: definition.value,
    label: 'symbol' in definition ? definition.symbol : translate(definition.labelKey),
  }));

const firstOperator = (field: QueryField | undefined): string => operatorDefinitions(field)[0]?.value ?? '';

export const combinatorLabel = (combinator: QueryGroup['combinator'], translate: StaticTranslate): string =>
  translate(COMBINATOR_LABEL_KEYS[combinator]);

const createQueryId = (): string => createId('q');

export const newQueryRule = (fields: QueryField[]): QueryRule => ({
  id: createQueryId(),
  field: fields[0]?.key ?? '',
  op: firstOperator(fields[0]),
  value: '',
});

export const newQueryGroup = (combinator: QueryGroup['combinator'], fields: QueryField[]): QueryGroup => ({
  id: createQueryId(),
  combinator,
  rules: [newQueryRule(fields)],
});

export const oppositeCombinator = (combinator: QueryGroup['combinator']): QueryGroup['combinator'] =>
  combinator === 'and' ? 'or' : 'and';

/** A query with one empty condition on the first field. */
export const emptyQuery = (fields: QueryField[] = []): QueryGroup => newQueryGroup('and', fields);

export const clearQuery = (query: QueryGroup): QueryGroup => ({ ...query, rules: [] });

/** The rule with its field replaced; operator and operand reset to the new field's defaults. */
export const withField = (rule: QueryRule, fields: QueryField[], key: string): QueryRule => ({
  ...rule,
  field: key,
  op: firstOperator(fields.find((field) => field.key === key)),
  value: '',
});

const describeNode = (node: QueryNode, fields: QueryField[], translate: StaticTranslate): string => {
  if (isQueryGroup(node)) return `(${describeRules(node, fields, translate)})`;
  const field = fields.find((candidate) => candidate.key === node.field);
  const operator = operatorsFor(field, translate).find((candidate) => candidate.value === node.op)?.label ?? node.op;
  if (VALUELESS_OPS.includes(node.op)) return `${field?.label ?? node.field} ${operator}`;
  const operand =
    field?.type === 'select'
      ? ((field.options ?? []).find((option) => option.value === node.value)?.label ?? '…')
      : node.value || '…';
  return `${field?.label ?? node.field} ${operator} ${operand}`;
};

const describeRules = (group: QueryGroup, fields: QueryField[], translate: StaticTranslate): string =>
  group.rules
    .map((rule) => describeNode(rule, fields, translate))
    .join(` ${combinatorLabel(group.combinator, translate).toUpperCase()} `);

/** One-line readable version of a query, e.g. "Status is Active AND (Plan is Pro OR Seats > 10)". Localized when given a `translate`; English otherwise. */
export const describeQuery = (
  query: QueryGroup,
  fields: QueryField[] = [],
  translate: StaticTranslate = englishText,
): string =>
  query.rules.length ? describeRules(query, fields, translate) : translate('velvetData.queryBuilder.allRecords');
