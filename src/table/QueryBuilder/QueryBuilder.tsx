import { IoAdd } from 'solid-icons/io';
import type { JSX } from 'solid-js';
import { createMemo, For, Show, splitProps } from 'solid-js';


import type { DivCoreNativeProps, Props, SelectOption } from '@jankrajewskiit/ui';
import { Button, Card, classNames, FormField, Heading, Icon, Select, Text, useI18n } from '@jankrajewskiit/ui';
import styles from './QueryBuilder.module.css';
import {
  appendQueryBuilderRule,
  getDefaultOperators,
  moveQueryBuilderRuleById,
  patchQueryBuilderRule,
  removeQueryBuilderRuleById,
  updateQueryBuilderCombinator,
} from './QueryBuilder.utils';
import QueryBuilderRuleRow from './QueryBuilderRuleRow';

export type QueryBuilderCombinator = 'and' | 'or';

export type QueryBuilderOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'isEmpty'
  | 'isNotEmpty';

export interface QueryBuilderFieldOption {
  value: string;
  label: string;
}

export interface QueryBuilderField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  operators?: readonly QueryBuilderOperator[];
  options?: readonly QueryBuilderFieldOption[];
}

export interface QueryBuilderRule {
  id: string;
  fieldKey: string;
  operator: QueryBuilderOperator;
  value: string;
}

export interface QueryBuilderValue {
  combinator: QueryBuilderCombinator;
  rules: QueryBuilderRule[];
}

interface QueryBuilderOwnProps extends Omit<DivCoreNativeProps, 'onChange'> {
  fields: readonly QueryBuilderField[];
  value: QueryBuilderValue;
  onChange: (next: QueryBuilderValue) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export type QueryBuilderProps = QueryBuilderOwnProps;

const QueryBuilder = (props: Props<QueryBuilderProps>) => {
  const { ts, t } = useI18n();
  const [local, cardProps] = splitProps(props, [
    'fields',
    'value',
    'onChange',
    'label',
    'description',
    'disabled',
    'class',
  ]);
  const fieldByKey = createMemo(() => new Map(local.fields.map((field) => [field.key, field])));
  const hasRules = createMemo(() => local.value.rules.length > 0);
  const titleLabel = createMemo(() => local.label ?? ts('common.queryBuilder'));
  const combinatorOptions = createMemo<SelectOption[]>(() => [
    { value: 'and', label: ts('query.combinator.and') },
    { value: 'or', label: ts('query.combinator.or') },
  ]);

  const getOperatorLabel = (operator: QueryBuilderOperator): string => t(`query.operator.${operator}` as const);

  const updateValue = (next: QueryBuilderValue) => {
    local.onChange(next);
  };

  const addRule = () => {
    if (local.disabled || local.fields.length === 0) return;
    const field = local.fields[0];
    if (!field) return;
    updateValue(appendQueryBuilderRule(local.value, field));
  };

  const clearRules = () => {
    updateValue({ ...local.value, rules: [] });
  };

  const updateRule = (ruleId: string, next: Partial<QueryBuilderRule>) => {
    updateValue(patchQueryBuilderRule(local.value, ruleId, next));
  };

  const moveRule = (ruleId: string, direction: -1 | 1) => {
    updateValue(moveQueryBuilderRuleById(local.value, ruleId, direction));
  };

  const removeRule = (ruleId: string) => {
    updateValue(removeQueryBuilderRuleById(local.value, ruleId));
  };

  const handleCombinatorChange: JSX.EventHandler<HTMLSelectElement, Event> = (event) => {
    updateValue(updateQueryBuilderCombinator(local.value, event.currentTarget.value === 'or' ? 'or' : 'and'));
  };

  const handleFieldChange = (rule: QueryBuilderRule, nextFieldKey: string) => {
    const field = fieldByKey().get(nextFieldKey);
    if (!field) return;
    updateRule(rule.id, {
      fieldKey: nextFieldKey,
      operator: getDefaultOperators(field)[0] ?? 'equals',
      value: '',
    });
  };

  return (
    <Card {...cardProps} class={classNames(styles.card, local.class)}>
      <div class={styles.header}>
        <div class={styles.headerCopy}>
          <Heading as="h3" level={3} variant="titleMd">
            {titleLabel()}
          </Heading>
          <Show when={local.description}>
            <Text as="p" variant="caption" tone="muted">
              {local.description}
            </Text>
          </Show>
        </div>
        <div class={styles.headerActions}>
          <Button variant="ghost" size="sm" disabled={local.disabled || !hasRules()} onClick={clearRules}>
            {ts('query.clearRules')}
          </Button>
          <Button variant="primary" size="sm" disabled={local.disabled || local.fields.length === 0} onClick={addRule}>
            <span class={styles.addButtonContent}>
              <Icon icon={IoAdd} />
              {ts('query.addRule')}
            </span>
          </Button>
        </div>
      </div>

      <FormField class={styles.combinatorField}>
        {(fieldProps) => (
          <Select
            {...fieldProps}
            size="sm"
            aria-label={ts('common.match')}
            value={local.value.combinator}
            onChange={handleCombinatorChange}
            disabled={local.disabled}
            options={combinatorOptions()}
          />
        )}
      </FormField>

      <Show
        when={hasRules()}
        fallback={
          <Text as="p" variant="bodySm" tone="muted">
            {ts('query.empty')}
          </Text>
        }
      >
        <div class={styles.rules}>
          <For each={local.value.rules}>
            {(rule, index) => {
              const selectedField = createMemo(() => fieldByKey().get(rule.fieldKey));
              const operators = createMemo(() => getDefaultOperators(selectedField()));

              return (
                <QueryBuilderRuleRow
                  rule={rule}
                  fields={local.fields}
                  field={selectedField()}
                  operators={operators()}
                  getOperatorLabel={getOperatorLabel}
                  disabled={local.disabled}
                  isFirst={index() === 0}
                  isLast={index() === local.value.rules.length - 1}
                  onFieldChange={(event) => handleFieldChange(rule, event.currentTarget.value)}
                  onOperatorChange={(event) =>
                    updateRule(rule.id, { operator: event.currentTarget.value as QueryBuilderOperator })
                  }
                  onValueInput={(event) => updateRule(rule.id, { value: event.currentTarget.value })}
                  onValueSelectChange={(event) => updateRule(rule.id, { value: event.currentTarget.value })}
                  onMoveUp={() => moveRule(rule.id, -1)}
                  onMoveDown={() => moveRule(rule.id, 1)}
                  onRemove={() => removeRule(rule.id)}
                />
              );
            }}
          </For>
        </div>
      </Show>
    </Card>
  );
};

export default QueryBuilder;
