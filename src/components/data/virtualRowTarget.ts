const ROW_CONTROL =
  'a[href],button,input,textarea,select,[role="button"],[contenteditable]:not([contenteditable="false"])';

export const isRowControl = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(ROW_CONTROL) !== null;
