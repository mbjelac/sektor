// A color made the more see-through the smaller the fraction: whole at 1, gone at 0.
export function fadedColor(hexColor: string, fraction: number): [number, number, number, number] {
  return [...parseHexColor(hexColor), Math.round(255 * fraction)];
}

export function parseHexColor(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}
