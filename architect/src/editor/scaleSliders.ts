import type { SubpanelState } from "./editorPanel";
import { createSlider, updateFunctionOnLine } from "./editorWidgets";

const SCALE_REGEX = /s\(\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*\)/;

const LOCK_UNLOCKED = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#888" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0" /></svg>`;
const LOCK_LOCKED = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ccc" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>`;

export function addScaleSliders(
  el: HTMLElement,
  state: SubpanelState,
  subpanels: SubpanelState[],
) {
  const group = document.createElement("div");
  group.className = "slider-group";

  const label = document.createElement("span");
  label.className = "slider-letter";
  label.textContent = "S";
  group.appendChild(label);

  const slidersCol = document.createElement("div");
  slidersCol.className = "sliders-col";

  const sliders = [
    createSliderWithReset(1, 200, 100),
    createSliderWithReset(1, 200, 100),
    createSliderWithReset(1, 200, 100),
  ];

  for (const { row } of sliders) {
    slidersCol.appendChild(row);
  }

  group.appendChild(slidersCol);

  // Lock button
  const lockBtn = document.createElement("button");
  lockBtn.className = "lock-btn";
  lockBtn.innerHTML = LOCK_UNLOCKED;
  lockBtn.addEventListener("click", () => {
    state.scaleLocked = !state.scaleLocked;
    lockBtn.innerHTML = state.scaleLocked ? LOCK_LOCKED : LOCK_UNLOCKED;
  });
  group.appendChild(lockBtn);

  el.appendChild(group);

  const update = () => {
    state.scaleX = parseInt(sliders[0].slider.value);
    state.scaleY = parseInt(sliders[1].slider.value);
    state.scaleZ = parseInt(sliders[2].slider.value);
    updateFunctionOnLine(
      subpanels,
      state,
      SCALE_REGEX,
      `s(${state.scaleX},${state.scaleY},${state.scaleZ})`,
    );
  };

  const prevValues = [100, 100, 100];

  for (let i = 0; i < sliders.length; i++) {
    sliders[i].slider.addEventListener("input", () => {
      if (state.scaleLocked) {
        const newVal = parseInt(sliders[i].slider.value);
        const delta = newVal - prevValues[i];

        // Check if any slider would exceed its limit
        const min = 1;
        const max = 200;
        let clampedDelta = delta;
        for (let j = 0; j < sliders.length; j++) {
          const projected = prevValues[j] + clampedDelta;
          if (projected < min) clampedDelta = min - prevValues[j];
          if (projected > max) clampedDelta = max - prevValues[j];
        }

        for (let j = 0; j < sliders.length; j++) {
          const clamped = Math.max(min, Math.min(max, prevValues[j] + clampedDelta));
          sliders[j].slider.value = String(clamped);
          prevValues[j] = clamped;
        }
      } else {
        prevValues[i] = parseInt(sliders[i].slider.value);
      }
      update();
    });
  }

  state.setScale = (x: number, y: number, z: number) => {
    state.scaleX = x;
    state.scaleY = y;
    state.scaleZ = z;
    sliders[0].slider.value = String(x);
    sliders[1].slider.value = String(y);
    sliders[2].slider.value = String(z);
    prevValues[0] = x;
    prevValues[1] = y;
    prevValues[2] = z;
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
    slider.value = String(100);
    slider.dispatchEvent(new Event("input", { bubbles: true }));
  });
  row.appendChild(resetBtn);

  return { row, slider };
}
