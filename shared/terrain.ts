// What a square of a sektor's map is made of. Ground is what the player builds on; sea is open
// water and elevation is rock standing out of the land, both of them there to be looked at and
// built around rather than on.
export const GROUND = 0;
export const SEA = 1;
export const ELEVATION = 2;

// A square of river is known by the side the river flowed into it from, so that the course of the
// whole river can be read off the map square by square. North is towards the first square of a row
// and west towards the first row, as it is for the sides of rock.
export const RIVER_FROM_NORTH = 3;
export const RIVER_FROM_WEST = 4;
export const RIVER_FROM_EAST = 5;
export const RIVER_FROM_SOUTH = 6;

export function isRiver(square: number | undefined): boolean {
  return square === RIVER_FROM_NORTH
    || square === RIVER_FROM_WEST
    || square === RIVER_FROM_EAST
    || square === RIVER_FROM_SOUTH;
}
