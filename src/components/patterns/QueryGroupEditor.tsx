import { Button, IconButton } from '@jankrajewskiit/ui/bare';
import { cx } from '@jankrajewskiit/ui/common';
import { createMemo, For, Match, Show, Switch } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import {
  combinatorLabel,
  isQueryGroup,
  newQueryGroup,
  newQueryRule,
  oppositeCombinator,
  type QueryField,
  type QueryGroup,
  type QueryNode,
  type QueryRule,
} from './queryModel';
import { QueryRuleEditor } from './QueryRuleEditor';

export interface QueryGroupEditorProps {
  group: QueryGroup;
  fields: QueryField[];
  onChange: (group: QueryGroup) => void;
  onRemove: () => void;
  /** 0 for the root group. */
  depth: number;
  maxDepth: number;
  disabled?: boolean;
  reorderable?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

const asGroup = (node: QueryNode): QueryGroup | undefined => (isQueryGroup(node) ? node : undefined);

const asRule = (node: QueryNode): QueryRule | undefined => (isQueryGroup(node) ? undefined : node);

/** A group of conditions and nested groups joined by one combinator. Rows are keyed by node id so inputs keep focus while typing. */
export const QueryGroupEditor = (props: QueryGroupEditorProps) => {
  const translate = useTranslate();
  const ids = createMemo(() => props.group.rules.map((node) => node.id));
  const combinator = () => props.group.combinator;
  const canRemoveRule = () => props.group.rules.length > 1 || props.depth > 0 || !!props.clearable;
  const canAddGroup = () => props.depth + 1 < props.maxDepth;

  const replace = (id: string, next: QueryNode) =>
    props.onChange({ ...props.group, rules: props.group.rules.map((node) => (node.id === id ? next : node)) });
  const remove = (id: string) =>
    props.onChange({ ...props.group, rules: props.group.rules.filter((node) => node.id !== id) });
  const append = (node: QueryNode) => props.onChange({ ...props.group, rules: [...props.group.rules, node] });
  const move = (from: number, to: number) => {
    if (props.disabled || to < 0 || to >= props.group.rules.length) return;
    const rules = [...props.group.rules];
    const node = rules.splice(from, 1)[0];
    if (!node) return;
    rules.splice(to, 0, node);
    props.onChange({ ...props.group, rules });
  };

  return (
    <div
      class={cx('vui-qb__group', props.depth > 0 && 'vui-qb__group--nested')}
      role="group"
      aria-label={translate(
        props.depth ? 'velvetData.queryBuilder.conditionGroup' : 'velvetData.queryBuilder.conditions',
      )}
    >
      <Show when={props.group.rules.length === 0}>
        <div class="vui-qb__empty">{translate('velvetData.queryBuilder.empty')}</div>
      </Show>
      <For each={ids()}>
        {(id, position) => (
          <Show when={props.group.rules.find((node) => node.id === id)}>
            {(node) => (
              <div class={cx('vui-qb__row', props.reorderable && 'vui-qb__row--move')}>
                <div class="vui-qb__lead">
                  <Switch fallback={<span>{combinatorLabel(combinator(), translate)}</span>}>
                    <Match when={position() === 0}>
                      <span>{translate('velvetData.queryBuilder.where')}</span>
                    </Match>
                    <Match when={position() === 1}>
                      <Button
                        variant="secondary"
                        size="xs"
                        iconRight="chevrons-up-down"
                        class="vui-qb__comb"
                        disabled={props.disabled}
                        aria-label={translate(
                          combinator() === 'and'
                            ? 'velvetData.queryBuilder.matchAll'
                            : 'velvetData.queryBuilder.matchAny',
                        )}
                        onClick={() => props.onChange({ ...props.group, combinator: oppositeCombinator(combinator()) })}
                      >
                        {combinatorLabel(combinator(), translate)}
                      </Button>
                    </Match>
                  </Switch>
                </div>
                <Switch>
                  <Match when={asGroup(node())}>
                    {(nested) => (
                      <QueryGroupEditor
                        group={nested()}
                        fields={props.fields}
                        depth={props.depth + 1}
                        maxDepth={props.maxDepth}
                        disabled={props.disabled}
                        reorderable={props.reorderable}
                        onChange={(next) => replace(id, next)}
                        onRemove={() => remove(id)}
                      />
                    )}
                  </Match>
                  <Match when={asRule(node())}>
                    {(rule) => (
                      <QueryRuleEditor
                        rule={rule()}
                        fields={props.fields}
                        canRemove={canRemoveRule()}
                        disabled={props.disabled}
                        onChange={(next) => replace(id, next)}
                        onRemove={() => remove(id)}
                      />
                    )}
                  </Match>
                </Switch>
                <Show when={props.reorderable}>
                  <div class="vui-qb__move">
                    <IconButton
                      size="xs"
                      icon="arrow-up"
                      label={translate('velvetData.queryBuilder.moveUp')}
                      disabled={props.disabled || position() === 0}
                      onClick={() => move(position(), position() - 1)}
                    />
                    <IconButton
                      size="xs"
                      icon="arrow-down"
                      label={translate('velvetData.queryBuilder.moveDown')}
                      disabled={props.disabled || position() === props.group.rules.length - 1}
                      onClick={() => move(position(), position() + 1)}
                    />
                  </div>
                </Show>
              </div>
            )}
          </Show>
        )}
      </For>
      <div class="vui-qb__add">
        <Button
          variant="ghost"
          size="sm"
          iconLeft="plus"
          disabled={props.disabled || !props.fields.length}
          onClick={() => append(newQueryRule(props.fields))}
        >
          {translate('velvetData.queryBuilder.addCondition')}
        </Button>
        <Show when={canAddGroup()}>
          <Button
            variant="ghost"
            size="sm"
            iconLeft="plus"
            disabled={props.disabled || !props.fields.length}
            onClick={() => append(newQueryGroup(oppositeCombinator(combinator()), props.fields))}
          >
            {translate('velvetData.queryBuilder.addGroup')}
          </Button>
        </Show>
        <Show when={props.depth > 0}>
          <Button
            variant="ghost"
            size="sm"
            class="vui-qb__drop"
            disabled={props.disabled}
            onClick={() => props.onRemove()}
          >
            {translate('velvetData.queryBuilder.removeGroup')}
          </Button>
        </Show>
        <Show when={props.depth === 0 && props.clearable}>
          <Button
            variant="ghost"
            size="sm"
            class="vui-qb__drop"
            disabled={props.disabled || !props.group.rules.length}
            onClick={() => props.onClear?.()}
          >
            {translate('velvetData.queryBuilder.clearRules')}
          </Button>
        </Show>
      </div>
    </div>
  );
};
