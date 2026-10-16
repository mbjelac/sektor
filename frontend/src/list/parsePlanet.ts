// The planet is written down as markdown. Under its Topology heading every ring has a heading of its
// own, numbered from the north pole down, and under that a line for every triangle of the ring, in
// order eastwards, holding the triangle's colour, followed by an L if the triangle is land, an F if
// the land is forest or a D if it is desert, and the triangle's biome. Only the colour is read here.
// The ring's climate zone stands on a line of its own and is not read here, nor is whatever stands
// outside the Topology section.
export function parsePlanetColors(planetMarkdown: string): string[][] {
  const colorRings: string[][] = [];
  let isInTopology = false;
  let currentRing: string[] | null = null;

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
      colorRings[Number(ringHeading[1])] = currentRing;
      continue;
    }
    if (currentRing && line !== "" && !line.startsWith("Climate:")) currentRing.push(line.split(/\s+/)[0]!);
  }

  return colorRings;
}
