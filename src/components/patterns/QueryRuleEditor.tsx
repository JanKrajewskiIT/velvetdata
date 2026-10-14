import { CloseButton, Input, Select } from '@jankrajewskiit/ui/bare';
import { Match, Switch } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import { operatorsFor, type QueryField, type QueryRule, VALUELESS_OPS, withField } from './queryModel';
import { queryRuleIssue } from './queryValidation';

export interface QueryRuleEditorProps {
  rule: QueryRule;
  fields: QueryField[];
  onChange: (rule: QueryRule) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
}

/** One `field operator value` condition row. */
export const QueryRuleEditor = (props: QueryRuleEditorProps) => {
  const translate = useTranslate();
  const field = (): QueryField | undefined =>
    props.fields.find((candidate) => candidate.key === props.rule.field) ?? props.fields[0];
  const inputType = () => {
    const type = field()?.type;
    return type === 'number' || type === 'date' ? type : 'text';
  };

  return (
    <div class="vui-qb__rule">
      <div class="vui-qb__field">
        <Select
          size="sm"
          disabled={props.disabled}
          aria-label={translate('velvetData.queryBuilder.field')}
          value={props.rule.field}
          options={props.fields.map((candidate) => ({ value: candidate.key, label: candidate.label }))}
          onValueChange={(key) => props.onChange(withField(props.rule, props.fields, key))}
        />
      </div>
      <div class="vui-qb__op">
        <Select
          size="sm"
          disabled={props.disabled || !operatorsFor(field(), translate).length}
          aria-label={translate('velvetData.queryBuilder.operator')}
          value={props.rule.op}
          options={operatorsFor(field(), translate)}
          onValueChange={(op) => props.onChange({ ...props.rule, op })}
        />
      </div>
      <Switch>
        <Match when={VALUELESS_OPS.includes(props.rule.op)}>
          <span class="vui-qb__value" />
        </Match>
        <Match when={field()?.type === 'select'}>
          <div class="vui-qb__value">
            <Select
              size="sm"
              disabled={props.disabled}
              aria-label={translate('velvetData.queryBuilder.value')}
              placeholder={translate('velvetData.queryBuilder.choose')}
              value={props.rule.value}
              error={
                queryRuleIssue(props.rule, props.fields) ? translate('velvetData.queryBuilder.invalidValue') : undefined
              }
              options={field()?.options ?? []}
              onValueChange={(value) => props.onChange({ ...props.rule, value })}
            />
          </div>
        </Match>
        <Match when={true}>
          <div class="vui-qb__value">
            <Input
              size="sm"
              disabled={props.disabled}
              aria-label={translate('velvetData.queryBuilder.value')}
              type={inputType()}
              error={
                queryRuleIssue(props.rule, props.fields) ? translate('velvetData.queryBuilder.invalidValue') : undefined
              }
              placeholder={field()?.placeholder ?? translate('velvetData.queryBuilder.value')}
              value={props.rule.value}
              onInput={(e) => props.onChange({ ...props.rule, value: e.currentTarget.value })}
            />
          </div>
        </Match>
      </Switch>
      <CloseButton
        label={translate('velvetData.queryBuilder.removeCondition')}
        disabled={props.disabled || !props.canRemove}
        onClick={() => props.onRemove()}
      />
    </div>
  );
};
