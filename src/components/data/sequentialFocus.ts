const FOCUSABLE =
  'a[href],area[href],button,input,select,textarea,iframe,object,embed,audio[controls],video[controls],summary,[contenteditable],[tabindex]';

const hasRenderedBox = (element: HTMLElement): boolean => {
  if (!(element instanceof HTMLAreaElement)) return element.getClientRects().length > 0;
  const map = element.closest('map');
  return (
    !!map?.name &&
    Array.from(element.ownerDocument.images).some(
      (image) =>
        image.useMap === `#${map.name}` &&
        image.getClientRects().length > 0 &&
        image.ownerDocument.defaultView?.getComputedStyle(image).visibility === 'visible',
    )
  );
};

const isAvailable = (element: HTMLElement): boolean => {
  if (
    !element.isConnected ||
    element.matches(':disabled,input[type="hidden"]') ||
    element.closest('[inert],[hidden]') ||
    !hasRenderedBox(element)
  )
    return false;
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  if (style?.visibility === 'hidden' || style?.visibility === 'collapse') return false;
  for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
    if (ancestor instanceof HTMLDetailsElement && !ancestor.open) {
      const summary = Array.from(ancestor.children).find((child) => child.tagName === 'SUMMARY');
      if (!summary?.contains(element)) return false;
    }
  }
  if (element.tagName === 'SUMMARY' && element.parentElement instanceof HTMLDetailsElement) {
    return Array.from(element.parentElement.children).find((child) => child.tagName === 'SUMMARY') === element;
  }
  return true;
};

const tabIndexOf = (element: HTMLElement): number => {
  if (element.hasAttribute('tabindex')) return element.tabIndex;
  if (element.isContentEditable && !element.parentElement?.isContentEditable) return 0;
  if (element.matches('audio[controls],video[controls],summary')) return 0;
  return element.tabIndex;
};

const radioTabStops = (elements: readonly HTMLElement[], direction: number): Set<HTMLElement> => {
  const groups = new Map<HTMLFormElement | null, Map<string, HTMLInputElement[]>>();
  const stops = new Set<HTMLElement>();
  for (const element of elements) {
    if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || !element.name) {
      stops.add(element);
      continue;
    }
    let names = groups.get(element.form);
    if (!names) {
      names = new Map();
      groups.set(element.form, names);
    }
    const group = names.get(element.name);
    if (group) group.push(element);
    else names.set(element.name, [element]);
  }
  for (const names of groups.values()) {
    for (const group of names.values()) {
      const stop = group.find((radio) => radio.checked) ?? (direction > 0 ? group[0] : group.at(-1));
      if (stop) stops.add(stop);
    }
  }
  return stops;
};

export const sequentialFocus = (document: Document, direction: number): HTMLElement[] => {
  const elements = Array.from(document.querySelectorAll(FOCUSABLE))
    .filter((element): element is HTMLElement => element instanceof HTMLElement)
    .filter((element) => tabIndexOf(element) >= 0 && isAvailable(element));
  elements.sort((left, right) => {
    const a = tabIndexOf(left);
    const b = tabIndexOf(right);
    if (a > 0 && b > 0) return a - b;
    if (a > 0) return -1;
    if (b > 0) return 1;
    return 0;
  });
  const stops = radioTabStops(elements, direction);
  return elements.filter((element) => stops.has(element));
};
