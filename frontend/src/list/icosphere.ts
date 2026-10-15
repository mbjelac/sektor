export type Point = [number, number, number];
export type Triangle = [Point, Point, Point];

// The sphere is an icosahedron with each of its twenty faces cut into a grid of smaller triangles,
// every corner then pushed out onto the sphere. Cutting every edge into four makes sixteen
// triangles of a face, and three hundred and twenty of the whole: the 4V geodesic sphere. The
// triangles come out nearly, though not exactly, alike.
export function createIcosphere(edgeDivisions: number): Triangle[] {
  return icosahedronFaces().flatMap(face => subdivideFace(face, edgeDivisions));
}

function icosahedronFaces(): Triangle[] {
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const corners: Point[] = [
    [-1, goldenRatio, 0], [1, goldenRatio, 0], [-1, -goldenRatio, 0], [1, -goldenRatio, 0],
    [0, -1, goldenRatio], [0, 1, goldenRatio], [0, -1, -goldenRatio], [0, 1, -goldenRatio],
    [goldenRatio, 0, -1], [goldenRatio, 0, 1], [-goldenRatio, 0, -1], [-goldenRatio, 0, 1],
  ];
  const faceCornerIndices = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  return faceCornerIndices.map(([first, second, third]) => [corners[first]!, corners[second]!, corners[third]!]);
}

// A point of the grid is named by how many steps it lies from the first corner towards the second
// and towards the third. Each square of the grid is halved into two triangles, except along the
// far edge, where only one fits.
function subdivideFace(face: Triangle, edgeDivisions: number): Triangle[] {
  const gridPoint = (stepsTowardsSecond: number, stepsTowardsThird: number) =>
    pointOnSphere(face, stepsTowardsSecond / edgeDivisions, stepsTowardsThird / edgeDivisions);
  const triangles: Triangle[] = [];

  for (let row = 0; row < edgeDivisions; row++) {
    for (let column = 0; column < edgeDivisions - row; column++) {
      triangles.push([gridPoint(row, column), gridPoint(row + 1, column), gridPoint(row, column + 1)]);
      if (column < edgeDivisions - row - 1) {
        triangles.push([gridPoint(row + 1, column), gridPoint(row + 1, column + 1), gridPoint(row, column + 1)]);
      }
    }
  }

  return triangles;
}

function pointOnSphere([first, second, third]: Triangle, shareOfSecond: number, shareOfThird: number): Point {
  const shareOfFirst = 1 - shareOfSecond - shareOfThird;
  const pointOnFace: Point = [0, 1, 2].map(axis =>
    first[axis]! * shareOfFirst + second[axis]! * shareOfSecond + third[axis]! * shareOfThird,
  ) as Point;
  const length = Math.hypot(...pointOnFace);
  return pointOnFace.map(coordinate => coordinate / length) as Point;
}
