// What the planet is like at one triangle.
export type PlanetRegion = {
  color: string;
  climate: string;
  biome: string;
  isLand: boolean;
  isForest: boolean;
  isDesert: boolean;
};

// The planet is written down as markdown. Under its Topology heading every ring has a heading of its
// own, numbered from the north pole down, then its climate zone on a line of its own, then a line for
// every triangle of the ring, in order eastwards, holding the triangle's colour, followed by an L if
// the triangle is land, an F if the land is forest or a D if it is desert, and the triangle's biome.
// Whatever stands outside the Topology section is not read here.
export function parsePlanet(planetMarkdown: string): PlanetRegion[][] {
  const regionRings: PlanetRegion[][] = [];
  let isInTopology = false;
  let currentRing: PlanetRegion[] | null = null;
  let currentClimate = "";

  for (const line of planetMarkdown.split("\n").map(line => line.trim())) {
    if (line.startsWith("# ")) {
      isInTopology = line === "# Topology";
      currentRing = null;
      continue;
    }
    if (!isInTopology) continue;

    const ringHeading = line.match(/^## Ring (\d+)$/);
    if (ringHeading) {
      currentRing = [];
      currentClimate = "";
      regionRings[Number(ringHeading[1])] = currentRing;
      continue;
    }
    const climate = line.match(/^Climate: (.+)$/);
    if (climate) {
      currentClimate = climate[1]!;
      continue;
    }
    if (currentRing && line !== "") currentRing.push(parseRegion(line, currentClimate));
  }

  return regionRings;
}

function parseRegion(line: string, climate: string): PlanetRegion {
  const [color, ...markers] = line.split(/\s+/);
  return {
    color: color!,
    climate,
    biome: markers.find(marker => !["L", "F", "D"].includes(marker)) ?? "",
    isLand: markers.includes("L"),
    isForest: markers.includes("F"),
    isDesert: markers.includes("D"),
  };
}
