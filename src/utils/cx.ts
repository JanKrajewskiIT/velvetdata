export type ClassValue = string | false | null | undefined;

export const cx = (...values: ClassValue[]): string => values.filter(Boolean).join(' ');

/** `modifier('vui-count', 'lg', 'md')` → `vui-count--lg`; the default value adds no class. */
export const modifier = (block: string, value: string | undefined, fallback?: string): string | false =>
  !!value && value !== fallback && `${block}--${value}`;
