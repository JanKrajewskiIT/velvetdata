import { SectionLabel } from '@jankrajewskiit/ui';
import { createControllable, cx } from '@jankrajewskiit/ui/common';
import { mergeProps, Show, untrack } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import { QueryGroupEditor } from './QueryGroupEditor';
import { clearQuery, describeQuery, emptyQuery, type QueryField, type QueryGroup } from './queryModel';

export type { QueryField, QueryFieldType, QueryGroup, QueryNode, QueryOperatorValue, QueryRule } from './queryModel';
export { clearQuery, describeQuery, emptyQuery } from './queryModel';

export interface QueryBuilderProps {
  fields: QueryField[];
  value?: QueryGroup;
  defaultValue?: QueryGroup;
  onChange?: (query: QueryGroup) => void;
  /** Preferred name — same callback as onChange (onChange stays as an alias). */
  onValueChange?: (query: QueryGroup) => void;
  /** 1 = flat list, 2 = one level of groups. @default 2 */
  maxDepth?: number;
  /** Readable one-line version under the builder */
  showSummary?: boolean;
  disabled?: boolean;
  /** Offer accessible move-up/down controls for rules and groups. @default true */
  reorderable?: boolean;
  /** @default false */
  clearable?: boolean;
  onClear?: (query: QueryGroup) => void;
  class?: string;
}

/**
 * Visual condition builder for segments, automations and advanced search: "Where Status is Active AND (Plan is Pro OR Seats > 10)".
 * Operators follow the field type; the combinator toggles on the second row of each group. Groups nest up to `maxDepth`.
 * For quick faceted filtering use FilterBar; QueryBuilder is for saved, precise rules.
 */
export const QueryBuilder = (props: QueryBuilderProps) => {
  const p = mergeProps(
    { maxDepth: 2, showSummary: false, reorderable: true } satisfies Partial<QueryBuilderProps>,
    props,
  );
  const translate = useTranslate();
  const [query, setQuery] = createControllable<QueryGroup>({
    value: () => p.value,
    defaultValue: untrack(() => p.defaultValue ?? emptyQuery(p.fields)),
    onChange: (next) => (p.onChange ?? p.onValueChange)?.(next),
  });

  return (
    <div class={cx('vui-qb', p.disabled && 'vui-qb--disabled', p.class)} aria-disabled={p.disabled || undefined}>
      <QueryGroupEditor
        group={query()}
        fields={p.fields}
        depth={0}
        maxDepth={p.maxDepth}
        disabled={p.disabled}
        reorderable={p.reorderable}
        onChange={(next) => {
          if (!p.disabled) setQuery(next);
        }}
        onRemove={() => undefined}
        clearable={p.clearable}
        onClear={() => {
          if (p.disabled) return;
          const next = clearQuery(query());
          setQuery(next);
          p.onClear?.(next);
        }}
      />
      <Show when={p.showSummary}>
        <div class="vui-qb__summary">
          <SectionLabel as="span">{translate('velvetData.queryBuilder.query')}</SectionLabel>
          <code>{describeQuery(query(), p.fields, translate)}</code>
        </div>
      </Show>
    </div>
  );
};
