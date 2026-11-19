import { DeforestationCriterion, HapinessCriterion, PollutionCriterion, PopulationCriterion } from "./mandates.api";
import { PlayerSektor } from "./sektorsMovingResource";
import { totalDeforestation } from "../sektor/deforestation";
import { totalPollution } from "../sektor/pollution";
import { totalPopulation } from "../sektor/population";
import { totalHapiness } from "../sektor/totalHapiness";

// A criterion asking for at least, or at most, so much of what the player's sektors come to between
// them, rather than of a resource.
export type MeasureCriterion = DeforestationCriterion | PollutionCriterion | PopulationCriterion | HapinessCriterion;

// What a criterion of a measure is told by: the measure's name, the picture standing for it, whether
// it asks for at least or at most, how much of it the player's sektors come to between them, and how
// much of it each of them comes to.
export interface Measure {
  name: string;
  icon: string;
  asksForAtLeast: boolean;
  playerAmount: (playerSektors: PlayerSektor[]) => number;
  sektorAmount: (playerSektor: PlayerSektor) => number;
}

const POPULATION_NAME = "Population";
// A baby.
const POPULATION_ICON = "\u{1F476}\u{1F3FD}";

const MEASURES: Record<MeasureCriterion["type"], Measure> = {
  // A forest on fire.
  maximumDeforestation: {
    name: "Deforestation",
    icon: "\u{1F333}\u{1F525}",
    asksForAtLeast: false,
    playerAmount: playerSektors => totalDeforestation(playerSektors.map(playerSektor => playerSektor.ecosystem)),
    sektorAmount: playerSektor => totalDeforestation([playerSektor.ecosystem]),
  },
  // A factory.
  maximumPollution: {
    name: "Pollution",
    icon: "\u{1F3ED}",
    asksForAtLeast: false,
    playerAmount: playerSektors => totalPollution(playerSektors.map(playerSektor => playerSektor.pollution)),
    sektorAmount: playerSektor => playerSektor.pollution,
  },
  minimumPopulation: {
    name: POPULATION_NAME,
    icon: POPULATION_ICON,
    asksForAtLeast: true,
    playerAmount: playerPopulation,
    sektorAmount: playerSektor => playerSektor.population,
  },
  maximumPopulation: {
    name: POPULATION_NAME,
    icon: POPULATION_ICON,
    asksForAtLeast: false,
    playerAmount: playerPopulation,
    sektorAmount: playerSektor => playerSektor.population,
  },
  // A smiling face.
  minimumHapiness: {
    name: "Hapiness",
    icon: "\u{263A}\u{FE0F}",
    asksForAtLeast: true,
    playerAmount: playerSektors => totalHapiness(playerSektors.map(playerSektor => playerSektor.hapiness)),
    sektorAmount: playerSektor => playerSektor.hapiness,
  },
};

export function measureOf(criterion: MeasureCriterion): Measure {
  return MEASURES[criterion.type];
}

function playerPopulation(playerSektors: PlayerSektor[]): number {
  return totalPopulation(playerSektors.map(playerSektor => playerSektor.population));
}
