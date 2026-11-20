// Tooltips are shown from the data-title attribute instead of the native title attribute, whose
// delay is chosen by the browser and cannot be shortened.
const TOOLTIP_DELAY_MILLISECONDS = 150;
const TOOLTIP_GAP = 6;

export function installTooltips() {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  document.body.appendChild(tooltip);

  let hoveredElement: HTMLElement | null = null;
  let showTimeout: number | undefined;

  document.addEventListener("mouseover", event => {
    const titledElement = (event.target as Element).closest<HTMLElement>("[data-title]");
    if (titledElement === hoveredElement) {
      return;
    }
    hoveredElement = titledElement;
    hideTooltip(tooltip);
    window.clearTimeout(showTimeout);
    if (titledElement) {
      showTimeout = window.setTimeout(() => showTooltip(tooltip, titledElement), TOOLTIP_DELAY_MILLISECONDS);
    }
  });

  document.addEventListener("mouseout", event => {
    if (event.relatedTarget === null) {
      hoveredElement = null;
      window.clearTimeout(showTimeout);
      hideTooltip(tooltip);
    }
  });

  document.addEventListener("mousedown", () => {
    window.clearTimeout(showTimeout);
    hideTooltip(tooltip);
  });
}

function hideTooltip(tooltip: HTMLElement) {
  tooltip.style.display = "none";
}

function showTooltip(tooltip: HTMLElement, titledElement: HTMLElement) {
  const text = titledElement.dataset.title;
  if (!text || !titledElement.isConnected) {
    return;
  }
  tooltip.textContent = text;
  tooltip.style.display = "block";

  const elementBox = titledElement.getBoundingClientRect();
  const tooltipBox = tooltip.getBoundingClientRect();
  const centeredLeft = elementBox.left + elementBox.width / 2 - tooltipBox.width / 2;
  const left = Math.min(Math.max(centeredLeft, TOOLTIP_GAP), window.innerWidth - tooltipBox.width - TOOLTIP_GAP);
  const fitsBelow = elementBox.bottom + TOOLTIP_GAP + tooltipBox.height <= window.innerHeight;
  const top = fitsBelow
    ? elementBox.bottom + TOOLTIP_GAP
    : elementBox.top - TOOLTIP_GAP - tooltipBox.height;
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}
