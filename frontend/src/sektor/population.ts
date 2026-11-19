// How many people a single habitat houses.
export const HABITATS_CAPACITY = 40;

// A sektor's people are all those its habitats house.
export function sektorPopulation(habitatCount: number): number {
  return habitatCount * HABITATS_CAPACITY;
}

// Sektors house between them all of their people added up.
export function totalPopulation(sektorPopulations: number[]): number {
  return sektorPopulations.reduce((total, sektorPopulation) => total + sektorPopulation, 0);
}
