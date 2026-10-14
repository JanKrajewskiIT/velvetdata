import { cellText } from '@jankrajewskiit/ui/common';

const ISO_DAY =
  /^(\d{4}-\d{2}-\d{2})(?:[tT ](?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,9})?)?(?:[zZ]|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?)?$/u;

/** Date objects use their UTC day; ISO strings retain the calendar day written in the value. */
export const queryDate = (value: unknown): string | undefined => {
  const day = ISO_DAY.exec(cellText(value))?.[1];
  if (!day) return undefined;
  const parsed = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day ? day : undefined;
};
