import { Button, IconButton, Text } from '@jankrajewskiit/ui/bare';
import { createMemo, For, Match, Show, Switch } from 'solid-js';

import { useTranslate } from '../../i18n/useTranslate';
import styles from './QueryGroupEditor.module.css';
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
      class={styles.root}
      data-nested={props.depth > 0 || undefined}
      role="group"
      aria-label={translate(
        props.depth ? 'velvetData.queryBuilder.conditionGroup' : 'velvetData.queryBuilder.conditions',
      )}
    >
      <Show when={props.group.rules.length === 0}>
        <Text as="div" variant="body-sm" tone="tertiary" class={styles.empty}>
          {translate('velvetData.queryBuilder.empty')}
        </Text>
      </Show>
      <For each={ids()}>
        {(id, position) => (
          <Show when={props.group.rules.find((node) => node.id === id)}>
            {(node) => (
              <div class={styles.row} data-reorderable={props.reorderable || undefined}>
                <div class={styles.lead}>
                  <Switch
                    fallback={
                      <Text as="span" variant="label" tone="tertiary">
                        {combinatorLabel(combinator(), translate)}
                      </Text>
                    }
                  >
                    <Match when={position() === 0}>
                      <Text as="span" variant="label" tone="tertiary">
                        {translate('velvetData.queryBuilder.where')}
                      </Text>
                    </Match>
                    <Match when={position() === 1}>
                      <Button
                        variant="secondary"
                        size="xs"
                        iconRight="chevrons-up-down"
                        class={styles.combinator}
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
                  <div class={styles.move}>
                    <IconButton
                      size="xs"
                      icon="arrow-up"
                      label={translate(
                        isQueryGroup(node())
                          ? 'velvetData.queryBuilder.moveGroupUp'
                          : 'velvetData.queryBuilder.moveConditionUp',
                        { position: position() + 1 },
                      )}
                      disabled={props.disabled || position() === 0}
                      onClick={() => move(position(), position() - 1)}
                    />
                    <IconButton
                      size="xs"
                      icon="arrow-down"
                      label={translate(
                        isQueryGroup(node())
                          ? 'velvetData.queryBuilder.moveGroupDown'
                          : 'velvetData.queryBuilder.moveConditionDown',
                        { position: position() + 1 },
                      )}
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
      <div class={styles.actions}>
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
            class={styles.remove}
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
            class={styles.remove}
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
