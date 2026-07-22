export function colorToRgb(color: string | undefined): [number, number, number] | [number, number, number, number] {
  if (!color) {
    return [160, 160, 160];
  }
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  if (color.length >= 9) {
    const a = parseInt(color.slice(7, 9), 16);
    return [r, g, b, a];
  }
  return [r, g, b];
}
