let sequence = 0;

/** Client-generated id that stays unique within the page for the lifetime of the module. */
export const createId = (prefix: string): string => `${prefix}${Date.now().toString(36)}-${sequence++}`;
