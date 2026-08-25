import { propertyDefinitions, PropertyDefinition } from "../properties";

let selectedProperty: string = propertyDefinitions[0]?.name ?? "";
let onChangeCallback: ((propertyName: string) => void) | null = null;

export function getSelectedProperty(): string {
  return selectedProperty;
}

export function onPropertyChange(callback: (propertyName: string) => void) {
  onChangeCallback = callback;
}

export function initPropertyToggler() {
  const panel = document.createElement("div");
  panel.id = "property-toggler";

  const title = document.createElement("div");
  title.className = "panel-title";
  title.textContent = "Geography";
  panel.appendChild(title);

  for (const property of propertyDefinitions) {
    const button = createToggleButton(property);
    panel.appendChild(button);
  }

  document.getElementById("left-panels")!.appendChild(panel);
  updateSelection();
}

function createToggleButton(property: PropertyDefinition): HTMLElement {
  const button = document.createElement("button");
  button.className = "property-toggle";
  button.dataset.property = property.name;
  const nameSpan = document.createElement("span");
  nameSpan.textContent = property.name;
  button.appendChild(nameSpan);

  const colorSwatch = document.createElement("span");
  colorSwatch.className = "property-swatch";
  colorSwatch.style.backgroundColor = property.color;
  button.appendChild(colorSwatch);
  button.addEventListener("click", () => {
    selectedProperty = property.name;
    updateSelection();
    onChangeCallback?.(property.name);
  });
  return button;
}

function updateSelection() {
  document.querySelectorAll(".property-toggle").forEach(element => {
    element.classList.toggle("selected", element.getAttribute("data-property") === selectedProperty);
  });
}
