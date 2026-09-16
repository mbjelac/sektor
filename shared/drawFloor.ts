import p5 from "p5";

export function drawFloor(p: p5, s: number, topColor?: [number, number, number]) {
  const h = s / 2;
  const height = s * 0.15;
  const green: [number, number, number] = topColor ?? [30, 200, 80];
  const brown: [number, number, number] = [180, 140, 90];
  const darkBrown: [number, number, number] = [100, 70, 40];

  // Top face (green)
  p.fill(...green);
  p.beginShape();
  p.normal(0, -1, 0);
  p.vertex(-h, -height / 2, -h);
  p.vertex(h, -height / 2, -h);
  p.vertex(h, -height / 2, h);
  p.vertex(-h, -height / 2, h);
  p.endShape(p.CLOSE);

  // Bottom face
  p.fill(...brown);
  p.beginShape();
  p.normal(0, 1, 0);
  p.vertex(-h, height / 2, -h);
  p.vertex(h, height / 2, -h);
  p.vertex(h, height / 2, h);
  p.vertex(-h, height / 2, h);
  p.endShape(p.CLOSE);

  // Front face (+z)
  p.fill(...darkBrown);
  p.beginShape();
  p.normal(0, 0, 1);
  p.vertex(-h, -height / 2, h);
  p.vertex(h, -height / 2, h);
  p.vertex(h, height / 2, h);
  p.vertex(-h, height / 2, h);
  p.endShape(p.CLOSE);

  // Back face (-z)
  p.fill(...darkBrown);
  p.beginShape();
  p.normal(0, 0, -1);
  p.vertex(-h, -height / 2, -h);
  p.vertex(h, -height / 2, -h);
  p.vertex(h, height / 2, -h);
  p.vertex(-h, height / 2, -h);
  p.endShape(p.CLOSE);

  // Left face (-x)
  p.fill(...darkBrown);
  p.beginShape();
  p.normal(-1, 0, 0);
  p.vertex(-h, -height / 2, -h);
  p.vertex(-h, -height / 2, h);
  p.vertex(-h, height / 2, h);
  p.vertex(-h, height / 2, -h);
  p.endShape(p.CLOSE);

  // Right face (+x)
  p.fill(...darkBrown);
  p.beginShape();
  p.normal(1, 0, 0);
  p.vertex(h, -height / 2, -h);
  p.vertex(h, -height / 2, h);
  p.vertex(h, height / 2, h);
  p.vertex(h, height / 2, -h);
  p.endShape(p.CLOSE);
}

// A building may ask for no floor under it. Leaving the tile out altogether tears a hole in the
// grid, so the floor is drawn as if its panels were completely transparent: the edges of the block
// are still there, the faces are not. The four sides carry every edge of the block between them.
export function drawFloorWireframe(p: p5, size: number) {
  const half = size / 2;
  const height = size * 0.15;
  const top = -height / 2;
  const bottom = height / 2;

  p.push();
  p.noFill();
  p.stroke(150, 150, 150, 80);
  drawSideOutline(p, [-half, -half], [half, -half], top, bottom);
  drawSideOutline(p, [half, -half], [half, half], top, bottom);
  drawSideOutline(p, [half, half], [-half, half], top, bottom);
  drawSideOutline(p, [-half, half], [-half, -half], top, bottom);
  p.pop();
}

function drawSideOutline(
  p: p5,
  [startX, startZ]: [number, number],
  [endX, endZ]: [number, number],
  top: number,
  bottom: number,
) {
  p.beginShape();
  p.vertex(startX, top, startZ);
  p.vertex(endX, top, endZ);
  p.vertex(endX, bottom, endZ);
  p.vertex(startX, bottom, startZ);
  p.endShape(p.CLOSE);
}
