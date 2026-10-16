// The planet is written down as markdown. Under its Topology heading every ring has a heading of its
// own, numbered from the north pole down, and under that a line for every triangle of the ring, in
// order eastwards, holding the triangle's colour, followed by an L if the triangle is land. Whatever
// stands outside the Topology section is not read here.
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
    if (currentRing && line !== "") currentRing.push(line.split(/\s+/)[0]!);
  }

  return colorRings;
}
