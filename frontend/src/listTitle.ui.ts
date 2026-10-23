// Every one of the three lists of the page carries its name above its columns, in the same place
// and in the same hand, so that the three read as three lists of the one page. The name stands
// across the whole width of the list, whatever columns it holds. A list may carry a picture in front
// of its name, saying at a glance what it is a list of.
export function createListTitle(title: string, titleIcon?: string): HTMLElement {
  const listTitle = document.createElement("div");
  listTitle.className = "list-title";
  listTitle.textContent = title;
  if (titleIcon) listTitle.insertAdjacentHTML("afterbegin", titleIcon);
  return listTitle;
}
