import type { SubpanelState } from "./editorPanel";
import { createSlider, updateFunctionOnLine } from "./editorWidgets";

const TRANSLATE_REGEX = /t\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)/;

export function addTranslateSliders(
  el: HTMLElement,
  state: SubpanelState,
  subpanels: SubpanelState[],
) {
  const group = document.createElement("div");
  group.className = "slider-group";

  const label = document.createElement("span");
  label.className = "slider-letter";
  label.textContent = "T";
  group.appendChild(label);

  const slidersCol = document.createElement("div");
  slidersCol.className = "sliders-col";

  const sliders = [
    createSliderWithReset(-100, 100, 0, 0),
    createSliderWithReset(-100, 100, 0, 0),
    createSliderWithReset(-100, 100, 0, 0),
  ];

  for (const { row } of sliders) {
    slidersCol.appendChild(row);
  }

  group.appendChild(slidersCol);
  el.appendChild(group);

  const update = () => {
    state.translateX = parseInt(sliders[0].slider.value);
    state.translateY = parseInt(sliders[1].slider.value);
    state.translateZ = parseInt(sliders[2].slider.value);
    updateFunctionOnLine(
      subpanels,
      state,
      TRANSLATE_REGEX,
      `t(${state.translateX},${state.translateY},${state.translateZ})`,
    );
  };

  for (const { slider } of sliders) {
    slider.addEventListener("input", update);
  }

  state.setTranslation = (x: number, y: number, z: number) => {
    state.translateX = x;
    state.translateY = y;
    state.translateZ = z;
    sliders[0].slider.value = String(x);
    sliders[1].slider.value = String(y);
    sliders[2].slider.value = String(z);
  };
}

function createSliderWithReset(
  min: number,
  max: number,
  value: number,
  resetValue: number,
): { row: HTMLElement; slider: HTMLInputElement } {
  const row = document.createElement("div");
  row.className = "slider-row";

  const slider = createSlider(min, max, value);
  row.appendChild(slider);

  const resetBtn = document.createElement("button");
  resetBtn.className = "reset-btn";
  resetBtn.textContent = "⛌";
  resetBtn.addEventListener("click", () => {
    slider.value = String(resetValue);
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  });
  row.appendChild(resetBtn);

  return { row, slider };
}
