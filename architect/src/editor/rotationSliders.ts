import type { SubpanelState } from "./editorPanel";
import { createSlider, updateFunctionOnLine } from "./editorWidgets";

const ROTATE_REGEX = /r\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)/;

export function addRotationSliders(
  el: HTMLElement,
  state: SubpanelState,
  subpanels: SubpanelState[],
) {
  const rotGroup = document.createElement("div");
  rotGroup.className = "slider-group";

  const rotLabel = document.createElement("span");
  rotLabel.className = "slider-letter";
  rotLabel.textContent = "R";
  rotGroup.appendChild(rotLabel);

  const slidersCol = document.createElement("div");
  slidersCol.className = "sliders-col";

  const sliderX = createSliderWithReset(-180, 180, 0);
  const sliderY = createSliderWithReset(-180, 180, 0);
  const sliderZ = createSliderWithReset(-180, 180, 0);
  slidersCol.appendChild(sliderX.row);
  slidersCol.appendChild(sliderY.row);
  slidersCol.appendChild(sliderZ.row);
  rotGroup.appendChild(slidersCol);
  el.appendChild(rotGroup);

  sliderX.slider.addEventListener("input", () => {
    state.rotateX = parseInt(sliderX.slider.value);
    updateRotateOnLine(state, subpanels);
  });
  sliderY.slider.addEventListener("input", () => {
    state.rotateY = parseInt(sliderY.slider.value);
    updateRotateOnLine(state, subpanels);
  });
  sliderZ.slider.addEventListener("input", () => {
    state.rotateZ = parseInt(sliderZ.slider.value);
    updateRotateOnLine(state, subpanels);
  });

  state.setRotation = (x: number, y: number, z: number) => {
    state.rotateX = x;
    state.rotateY = y;
    state.rotateZ = z;
    sliderX.slider.value = String(x);
    sliderY.slider.value = String(y);
    sliderZ.slider.value = String(z);
  };
}

function createSliderWithReset(
  min: number,
  max: number,
  value: number,
): { row: HTMLElement; slider: HTMLInputElement } {
  const row = document.createElement("div");
  row.className = "slider-row";

  const slider = createSlider(min, max, value);
  row.appendChild(slider);

  const resetBtn = document.createElement("button");
  resetBtn.className = "reset-btn";
  resetBtn.textContent = "⛌";
  resetBtn.addEventListener("click", () => {
    slider.value = "0";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  });
  row.appendChild(resetBtn);

  return { row, slider };
}

function updateRotateOnLine(panel: SubpanelState, subpanels: SubpanelState[]) {
  updateFunctionOnLine(
    subpanels,
    panel,
    ROTATE_REGEX,
    `r(${panel.rotateX},${panel.rotateY},${panel.rotateZ})`,
  );
}
