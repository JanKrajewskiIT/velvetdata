import { sequentialFocus } from './sequentialFocus';

export const focusOutsideGrid = (grid: HTMLElement, direction: number): void => {
  if (!grid.isConnected) return;
  const document = grid.ownerDocument;
  const candidates = sequentialFocus(document, direction);
  const inside = candidates.flatMap((element, index) => (grid.contains(element) ? [index] : []));
  const boundary = direction > 0 ? inside.at(-1) : inside[0];
  const outside =
    boundary === undefined
      ? candidates.filter(
          (element) =>
            !grid.contains(element) &&
            !!(
              grid.compareDocumentPosition(element) &
              (direction > 0 ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING)
            ),
        )
      : candidates.slice(direction > 0 ? boundary + 1 : 0, direction > 0 ? undefined : boundary);
  if (direction < 0) outside.reverse();
  for (const element of outside) {
    element.focus();
    if (document.activeElement === element) return;
  }
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
};
