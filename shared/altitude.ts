// How high the ground of a location stands above the lowest ground there is. An altitude of 0 is
// the ground everything else is measured against; every step up makes the location's floor block
// a little taller, its bottom staying level with the bottoms of all the others.
export const ALTITUDE_PROPERTY = "altitude";
export const MIN_ALTITUDE = 0;
export const MAX_ALTITUDE = 9;

// Ground climbing a step at a time is a slope; ground climbing more than a step between two
// neighbouring locations is a cliff. Cliffs are meant to be seen now and then, not to be what a
// map is made of.
export const CLIFF_ALTITUDE_DIFFERENCE = 1;
