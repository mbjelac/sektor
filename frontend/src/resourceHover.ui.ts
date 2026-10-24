// Which resource the player is pointing at, wherever they point at it: a row of the sektor's own
// imports and exports, a resource named in a message, or a resource of the building panel. The map
// marks the buildings the same way whichever it was, so all say it the same way. Pointed at in the
// building panel, the resource is told as being pointed at from there, as the map then leaves out
// the building whose panel it is, and every function of the sektor not running.
export interface ResourcePointing {
  resourceName: string;
  fromBuildingPanel: boolean;
}

let resourceHoverCallback: ((resourcePointing: ResourcePointing | null) => void) | null = null;

export function onResourceHover(callback: (resourcePointing: ResourcePointing | null) => void) {
  resourceHoverCallback = callback;
}

// Points at the resource for as long as the pointer is over the element, and at nothing once it
// leaves again.
export function pointAtResourceWhileHovered(element: HTMLElement, resourceName: string, fromBuildingPanel = false) {
  element.addEventListener("mouseenter", () => resourceHoverCallback?.({ resourceName, fromBuildingPanel }));
  element.addEventListener("mouseleave", () => resourceHoverCallback?.(null));
}
