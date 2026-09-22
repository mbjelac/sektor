// Which resource the player is pointing at, wherever they point at it: a row of the sektor's own
// imports and exports, or a resource named in a message. The map marks the buildings the same way
// whichever it was, so both say it the same way.
let resourceHoverCallback: ((resourceName: string | null) => void) | null = null;

export function onResourceHover(callback: (resourceName: string | null) => void) {
  resourceHoverCallback = callback;
}

// Points at the resource for as long as the pointer is over the element, and at nothing once it
// leaves again.
export function pointAtResourceWhileHovered(element: HTMLElement, resourceName: string) {
  element.addEventListener("mouseenter", () => resourceHoverCallback?.(resourceName));
  element.addEventListener("mouseleave", () => resourceHoverCallback?.(null));
}
