// Rows of the matrix the sphere is turned by, the turns of every drag gathered into it. The planet
// is drawn turned by it and then turned over about the screen's level, so that the planet's north,
// up its own y axis, stands at the top of the screen, whose y runs downwards.
export type Rotation = [[number, number, number], [number, number, number], [number, number, number]];

export const UNTURNED: Rotation = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

const RADIANS_PER_DRAGGED_PIXEL = 0.01;

// The sphere turns the way it is dragged, whichever way it has already been turned: a drag sideways
// turns it about the upright of the screen and a drag up or down about the level of the screen, the
// screen's y running downwards. The turn of the drag is put before the turns already gathered.
export function dragRotation(draggedX: number, draggedY: number, rotation: Rotation): Rotation {
  const aboutLevel = -draggedY * RADIANS_PER_DRAGGED_PIXEL;
  const turnAboutLevel: Rotation = [
    [1, 0, 0],
    [0, Math.cos(aboutLevel), -Math.sin(aboutLevel)],
    [0, Math.sin(aboutLevel), Math.cos(aboutLevel)],
  ];
  return multiply(turnAboutLevel, multiply(turnAboutUpright(draggedX * RADIANS_PER_DRAGGED_PIXEL), rotation));
}

// The planet stood upright, its north pole straight up the screen and its south pole straight down,
// both as far from the viewer as each other. Of all the ways to stand it so, the one kept is the one
// still showing the viewer the line of longitude it showed before.
export function uprightRotation(rotation: Rotation): Rotation {
  // The point of the planet facing the viewer, in the planet's own axes: the turns undone, then the
  // turning over.
  const [facingX, , facingZ] = [rotation[2][0], -rotation[2][1], -rotation[2][2]];
  const facingLongitude = Math.hypot(facingX, facingZ) < 1e-9 ? -Math.PI / 2 : Math.atan2(facingZ, facingX);
  return turnAboutUpright(Math.atan2(-Math.cos(facingLongitude), -Math.sin(facingLongitude)));
}

function turnAboutUpright(angle: number): Rotation {
  return [
    [Math.cos(angle), 0, Math.sin(angle)],
    [0, 1, 0],
    [-Math.sin(angle), 0, Math.cos(angle)],
  ];
}

function multiply(left: Rotation, right: Rotation): Rotation {
  return [0, 1, 2].map(row =>
    [0, 1, 2].map(column => left[row]![0] * right[0]![column]! + left[row]![1] * right[1]![column]! + left[row]![2] * right[2]![column]!),
  ) as Rotation;
}
