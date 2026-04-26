import type { SelectOption } from '@jankrajewskiit/ui';
import { FormField, IconButton, Input, Select, useI18n } from '@jankrajewskiit/ui';
import { IoArrowDown, IoArrowUp, IoTrash } from 'solid-icons/io';
import { createMemo, type JSX, Show } from 'solid-js';

import type { QueryBuilderField, QueryBuilderOperator, QueryBuilderRule } from './QueryBuilder';
import styles from './QueryBuilder.module.css';
import { requiresValue } from './QueryBuilder.utils';

interface QueryBuilderRuleRowProps {
  rule: QueryBuilderRule;
  fields: readonly QueryBuilderField[];
  field?: QueryBuilderField;
  operators: readonly QueryBuilderOperator[];
  getOperatorLabel: (operator: QueryBuilderOperator) => string;
  disabled?: boolean;
  isFirst: boolean;
  isLast: boolean;
  onFieldChange: JSX.EventHandler<HTMLSelectElement, Event>;
  onOperatorChange: JSX.EventHandler<HTMLSelectElement, Event>;
  onValueInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
  onValueSelectChange: JSX.EventHandler<HTMLSelectElement, Event>;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

const QueryBuilderRuleRow = (props: QueryBuilderRuleRowProps) => {
  const { ts } = useI18n();
  const valueRequired = createMemo(() => requiresValue(props.rule.operator));
  const selectableOptions = createMemo(() => props.field?.options ?? []);
  const hasSelectableOptions = createMemo(() => props.field?.type === 'select' && selectableOptions().length > 0);
  const inputType = createMemo(() => (props.field?.type === 'number' ? 'number' : 'text'));
  const fieldSelectOptions = createMemo<SelectOption[]>(() =>
    props.fields.map((field) => ({ value: field.key, label: field.label })),
  );
  const operatorSelectOptions = createMemo<SelectOption[]>(() =>
    props.operators.map((operator) => ({ value: operator, label: props.getOperatorLabel(operator) })),
  );
  const valueSelectOptions = createMemo<SelectOption[]>(() => [
    { value: '', label: ts('common.selectEllipsis') },
    ...selectableOptions().map((option) => ({ value: option.value, label: option.label })),
  ]);

  return (
    <div class={styles.rule}>
      <FormField>
        {(fieldProps) => (
          <Select
            {...fieldProps}
            size="sm"
            aria-label={ts('common.field')}
            value={props.rule.fieldKey}
            onChange={props.onFieldChange}
            disabled={props.disabled}
            options={fieldSelectOptions()}
          />
        )}
      </FormField>

      <FormField>
        {(fieldProps) => (
          <Select
            {...fieldProps}
            size="sm"
            aria-label={ts('common.operator')}
            value={props.rule.operator}
            onChange={props.onOperatorChange}
            disabled={props.disabled}
            options={operatorSelectOptions()}
          />
        )}
      </FormField>

      <FormField>
        {(fieldProps) => (
          <Show
            when={valueRequired()}
            fallback={
              <Input
                {...fieldProps}
                value=""
                size="sm"
                readOnly
                disabled
                aria-label={ts('common.value')}
                class={styles.inputDisabled}
              />
            }
          >
            <Show
              when={hasSelectableOptions()}
              fallback={
                <Input
                  {...fieldProps}
                  type={inputType()}
                  value={props.rule.value}
                  size="sm"
                  aria-label={ts('common.value')}
                  onInput={props.onValueInput}
                  disabled={props.disabled}
                />
              }
            >
              <Select
                {...fieldProps}
                size="sm"
                aria-label={ts('common.value')}
                value={props.rule.value}
                onChange={props.onValueSelectChange}
                disabled={props.disabled}
                options={valueSelectOptions()}
              />
            </Show>
          </Show>
        )}
      </FormField>

      <div class={styles.ruleActions}>
        <IconButton
          icon={IoArrowUp}
          label={ts('query.moveRuleUp')}
          size="sm"
          disabled={props.disabled || props.isFirst}
          onClick={props.onMoveUp}
        />
        <IconButton
          icon={IoArrowDown}
          label={ts('query.moveRuleDown')}
          size="sm"
          disabled={props.disabled || props.isLast}
          onClick={props.onMoveDown}
        />
        <IconButton
          icon={IoTrash}
          label={ts('query.removeRule')}
          size="sm"
          disabled={props.disabled}
          onClick={props.onRemove}
        />
      </div>
    </div>
  );
};

export default QueryBuilderRuleRow;
