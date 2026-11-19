import { DeforestationCriterion, PollutionCriterion, PopulationCriterion } from "./mandates.api";
import { PlayerSektor } from "./sektorsMovingResource";
import { totalDeforestation } from "../sektor/deforestation";
import { totalPollution } from "../sektor/pollution";
import { totalPopulation } from "../sektor/population";

// A criterion asking for at least, or at most, so much of what the player's sektors come to between
// them, rather than of a resource.
export type MeasureCriterion = DeforestationCriterion | PollutionCriterion | PopulationCriterion;

// What a criterion of a measure is told by: the measure's name, the picture standing for it, whether
// it asks for at least or at most, and how much of it the player's sektors come to between them.
export interface Measure {
  name: string;
  icon: string;
  asksForAtLeast: boolean;
  playerAmount: (playerSektors: PlayerSektor[]) => number;
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
  },
  // A factory.
  maximumPollution: {
    name: "Pollution",
    icon: "\u{1F3ED}",
    asksForAtLeast: false,
    playerAmount: playerSektors => totalPollution(playerSektors.map(playerSektor => playerSektor.pollution)),
  },
  minimumPopulation: { name: POPULATION_NAME, icon: POPULATION_ICON, asksForAtLeast: true, playerAmount: playerPopulation },
  maximumPopulation: { name: POPULATION_NAME, icon: POPULATION_ICON, asksForAtLeast: false, playerAmount: playerPopulation },
};

export function measureOf(criterion: MeasureCriterion): Measure {
  return MEASURES[criterion.type];
}

function playerPopulation(playerSektors: PlayerSektor[]): number {
  return totalPopulation(playerSektors.map(playerSektor => playerSektor.population));
}
