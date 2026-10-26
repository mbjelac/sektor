# Generates a park: a flat green square, optionally with elliptical ponds, and trees standing in groves on the grass.
#
# A pond is a green ring (a cyl hollowed by h(60)) around a blue water disc a little smaller than the ring, so the
# water shows only through the ring's hollow. On every pond, white rings (thin tori) like ripples start small at random spots,
# grow and fade out at once, then stay away for a while before they start again.
#
# The trees stand in groups spread over the park, with a few lone trees between them; none stands in a pond's hollow,
# though one may stand on its green ring.
#
# Run from anywhere:
#   python3 tools/sgl/generator/park/park.py                                  # a park without ponds
#   python3 tools/sgl/generator/park/park.py --pond=-21,-25,43,43,40,40 --pond=18,13,60,70   # the template's ponds
#   ... --seed=7 --out=<file>                                                 # another layout, written to a file
import argparse
import math
import random
import sys

GROUND = 'pri4 s(142,142,0.1) t(0,0,0) c(#5bbf5a)'
GRASS_COLOR = '#5bbf5a'
WATER_COLOR = '#61adff'
PARK_REACH = 49.5           # a pri4 s(142) reaches 50.2 from the centre
RING_HEIGHT = 0.12
WATER_HEIGHT = 0.11
RING_HOLLOW = 60
WATER_INSET = 2             # how much narrower the water is than its ring, when not given

RIPPLES_PER_POND = 4
RIPPLE_START_DIAMETER = 2
RIPPLE_SIZE_PER_DIAMETER = 0.75   # a tor is 4/3 of its s() across, so a ripple d across is s(0.75 d)
RIPPLE_HEIGHT = 7.5               # the s() height which stands the tube of a tor h(100) 0.1 high
RIPPLE_BASE = 0.111         # just above the water's surface
RIPPLE_EDGE_MARGIN = 0.5    # a full-grown ripple keeps this far inside the hollow: it stands higher than the ring
RIPPLE_SMALLEST_SHARE = 0.45    # a ripple grows to at least this share of the hollow's narrower width
RIPPLE_SPACING_SHARE = 0.25     # ripple centres are at least this share of the narrower width apart
RIPPLE_PAUSE = 5000
RIPPLE_LATEST_START = 7000
RIPPLE_LEAST_START_GAP = 700
RIPPLE_TRIES = 2000         # spots tried for a ripple before it may be smaller and nearer the others

TREES = 96
LONE_TREES = 12
GROVES = 14
GROVE_SPACING = 17          # least distance between grove centres
GROVE_REACH = (7, 11)       # how far a grove's trees stand from its centre
GROVE_GAP = (0.3, 1.5)      # gap between neighbouring crowns in a grove
LONE_TREE_GAP = 6
TREE_EDGE_MARGIN = 1        # a crown keeps this far from the park's edge
TREE_WATER_MARGIN = 0.3
TREE_WIDTHS = [3, 3, 4, 4, 4, 5, 5]
LONE_TREE_WIDTHS = [3, 4, 4, 5]
GROVE_CENTER_TRIES = 5000   # when this many spots fail, the park gets fewer groves
GROVE_TREE_TRIES = 50000
TREE_BUCKET_SIZE = 12       # neighbouring trees are looked up by bucket; wider than any crown plus gap
EDGE_SEARCH_STEPS = 32      # angles looked at before narrowing down on the nearest point of a pond's edge
EDGE_SEARCH_NARROWINGS = 25
NO_WATER_NEARBY = 99


class Pond:
    def __init__(self, center_x, center_y, ring_width, ring_depth, water_width, water_depth):
        self.center_x, self.center_y = center_x, center_y
        self.ring_width, self.ring_depth = ring_width, ring_depth
        self.water_width, self.water_depth = water_width, water_depth
        # what shows of the water: the ring's hollow
        self.hollow_reach_x = ring_width / 2 * RING_HOLLOW / 100
        self.hollow_reach_y = ring_depth / 2 * RING_HOLLOW / 100

    def in_hollow(self, x, y, margin=0):
        return (((x - self.center_x) / (self.hollow_reach_x - margin)) ** 2
                + ((y - self.center_y) / (self.hollow_reach_y - margin)) ** 2) <= 1

    # The nearest of a few points around the edge, then narrowed down around it: near the nearest point of an
    # ellipse's edge, the distance has a single low.
    def distance_to_hollow_edge(self, x, y):
        step = 2 * math.pi / EDGE_SEARCH_STEPS
        nearest_angle = min((index * step for index in range(EDGE_SEARCH_STEPS)),
                            key=lambda angle: self.distance_to_edge_point(x, y, angle))
        low, high = nearest_angle - step, nearest_angle + step
        for _ in range(EDGE_SEARCH_NARROWINGS):
            lower_third, upper_third = low + (high - low) / 3, high - (high - low) / 3
            if self.distance_to_edge_point(x, y, lower_third) < self.distance_to_edge_point(x, y, upper_third):
                high = upper_third
            else:
                low = lower_third
        return self.distance_to_edge_point(x, y, (low + high) / 2)

    def distance_to_edge_point(self, x, y, angle):
        return math.hypot(x - self.center_x - self.hollow_reach_x * math.cos(angle),
                          y - self.center_y - self.hollow_reach_y * math.sin(angle))

    def near(self, x, y, reach):
        return (abs(x - self.center_x) <= self.hollow_reach_x + reach
                and abs(y - self.center_y) <= self.hollow_reach_y + reach)

    def within_park(self):
        return (abs(self.center_x) + self.ring_width / 2 <= PARK_REACH
                and abs(self.center_y) + self.ring_depth / 2 <= PARK_REACH)


def main():
    arguments = parse_arguments()
    random.seed(arguments.seed)
    ponds = [parse_pond(pond_argument) for pond_argument in arguments.pond]
    for pond in ponds:
        if not pond.within_park():
            sys.exit(f'pond at ({pond.center_x},{pond.center_y}) reaches past the edge of the park')
    lines = park(ponds)
    text = '\n'.join(lines) + '\n'
    if arguments.out:
        with open(arguments.out, 'w') as output:
            output.write(text)
    else:
        sys.stdout.write(text)


def parse_arguments():
    parser = argparse.ArgumentParser(description='Generate a park, with or without ponds.')
    parser.add_argument('--pond', action='append', default=[],
                        help='x,y,ring_width,ring_depth[,water_width,water_depth]; repeat for more ponds')
    parser.add_argument('--seed', type=int, default=5)
    parser.add_argument('--out', help='file to write; prints when left out')
    return parser.parse_args()


def parse_pond(pond_argument):
    values = [float(value) for value in pond_argument.split(',')]
    if len(values) == 4:
        values += [values[2] - WATER_INSET, values[3] - WATER_INSET]
    if len(values) != 6:
        sys.exit(f'--pond takes 4 or 6 numbers, not "{pond_argument}"')
    return Pond(*values)


def park(ponds):
    lines = [GROUND, '']
    for pond in ponds:
        lines.append(f'cyl s({number(pond.ring_width)},{number(pond.ring_depth)},{RING_HEIGHT}) '
                     f't({number(pond.center_x)},{number(pond.center_y)},0) h({RING_HOLLOW}) c({GRASS_COLOR})')
        lines.append(f'cyl s({number(pond.water_width)},{number(pond.water_depth)},{WATER_HEIGHT}) '
                     f't({number(pond.center_x)},{number(pond.center_y)},0) c({WATER_COLOR})')
        lines.append('')
    for pond in ponds:
        lines += ripples(pond)
        lines.append('')
    lines += trees(ponds)
    return lines


# Ripples on one pond. They all share one cycle — grow, then pause — so the uneven gaps between their starts
# never drift. Each grows only as far as its spot leaves room for, as it stands higher than the ring around it.
def ripples(pond):
    narrower_width = 2 * min(pond.hollow_reach_x, pond.hollow_reach_y)
    smallest_diameter = round(RIPPLE_SMALLEST_SHARE * narrower_width)
    spacing = RIPPLE_SPACING_SHARE * narrower_width
    grow_time = 3000 if narrower_width < 30 else 4000
    starts = ripple_starts()
    placed = []
    lines = []
    for start in starts:
        x, y, final_diameter = ripple_spot(pond, placed, smallest_diameter, spacing)
        placed.append((x, y))
        start_size = ripple_size(RIPPLE_START_DIAMETER)
        growth = ripple_size(final_diameter - RIPPLE_START_DIAMETER)
        lines.append(f'tor s({start_size},{start_size},{RIPPLE_HEIGHT}) t({x},{y},{RIPPLE_BASE}) h(100) '
                     f'c(#ffffffff) sh(100) as1({growth},{growth},0,{grow_time},{RIPPLE_PAUSE},{start}) '
                     f'acg1(#ffffff00,{grow_time},{RIPPLE_PAUSE},{start})')
    return lines


# A ripple is a torus hollowed all the way, which leaves a thin white line around the spot it grows from.
def ripple_size(diameter):
    return f'{diameter * RIPPLE_SIZE_PER_DIAMETER:.2f}'.rstrip('0').rstrip('.')


# A spot inside the hollow, far enough from the other ripples, leaving room to grow. When none turns up, the ripple
# may stay a little smaller and stand a little nearer the others.
def ripple_spot(pond, placed, smallest_diameter, spacing):
    while True:
        for _ in range(RIPPLE_TRIES):
            angle = random.uniform(0, 2 * math.pi)
            share = math.sqrt(random.random())
            x = round(pond.center_x + pond.hollow_reach_x * share * math.cos(angle), 1)
            y = round(pond.center_y + pond.hollow_reach_y * share * math.sin(angle), 1)
            if any(math.hypot(x - placed_x, y - placed_y) < spacing for placed_x, placed_y in placed):
                continue
            final_diameter = math.floor(2 * (pond.distance_to_hollow_edge(x, y) - RIPPLE_EDGE_MARGIN))
            if final_diameter >= smallest_diameter:
                return x, y, final_diameter
        smallest_diameter = max(RIPPLE_START_DIAMETER + 1, smallest_diameter - 1)
        spacing *= 0.9


def ripple_starts():
    while True:
        starts = sorted(random.randrange(0, RIPPLE_LATEST_START, 100) for _ in range(RIPPLES_PER_POND))
        if all(later - earlier >= RIPPLE_LEAST_START_GAP for earlier, later in zip(starts, starts[1:])):
            return starts


# Trees: most stand in groves, crowns nearly touching; a few stand alone between the groves.
def trees(ponds):
    clearances = water_clearances(ponds)
    placed = []
    buckets = {}

    grove_centers = []
    center_candidates = [point for point, clearance in clearances.items()
                         if clearance >= 3 and abs(point[0]) <= 44 and abs(point[1]) <= 44]
    for _ in range(GROVE_CENTER_TRIES):
        if len(grove_centers) == GROVES:
            break
        x, y = random.choice(center_candidates)
        if all(math.hypot(x - center_x, y - center_y) > GROVE_SPACING for center_x, center_y in grove_centers):
            grove_centers.append((x, y))
    if len(grove_centers) < GROVES:
        print(f'only {len(grove_centers)} of {GROVES} groves fit', file=sys.stderr)
    grove_reaches = [random.uniform(*GROVE_REACH) for _ in grove_centers]
    grove_weights = [random.uniform(0.6, 1.4) for _ in grove_centers]

    for _ in range(GROVE_TREE_TRIES):
        if len(placed) == TREES - LONE_TREES:
            break
        grove = random.choices(range(len(grove_centers)), grove_weights)[0]
        (center_x, center_y), reach = grove_centers[grove], grove_reaches[grove]
        width = random.choice(TREE_WIDTHS)
        angle = random.uniform(0, 2 * math.pi)
        distance = reach * math.sqrt(random.random())
        x, y = round(center_x + distance * math.cos(angle)), round(center_y + distance * math.sin(angle))
        if tree_fits(clearances, buckets, x, y, width, random.uniform(*GROVE_GAP)):
            place_tree(placed, buckets, x, y, width)

    # every free spot once, in random order, rather than random spots until enough are found
    lone_candidates = [point for point in clearances if abs(point[0]) <= 47 and abs(point[1]) <= 47]
    random.shuffle(lone_candidates)
    for x, y in lone_candidates:
        if len(placed) == TREES:
            break
        width = random.choice(LONE_TREE_WIDTHS)
        if tree_fits(clearances, buckets, x, y, width, LONE_TREE_GAP):
            place_tree(placed, buckets, x, y, width)
    if len(placed) < TREES:
        print(f'only {len(placed)} of {TREES} trees fit', file=sys.stderr)

    lines = []
    for x, y, width in placed:
        height = random.choice([width, width + 1, width + 1, width + 2, width + 3, 2 * width])
        lines.append(f'sph s({width},{width},{height}) t({x},{y},0) c({tree_color()})')
    return lines


# How far each whole-numbered spot of the park lies from the nearest pond's water; negative in the water. Worked out
# once, as every tree is tried on such spots.
def water_clearances(ponds):
    clearances = {}
    reach = math.floor(PARK_REACH)
    for x in range(-reach, reach + 1):
        for y in range(-reach, reach + 1):
            clearance = NO_WATER_NEARBY
            for pond in ponds:
                if pond.in_hollow(x, y):
                    clearance = -1
                elif pond.near(x, y, TREE_BUCKET_SIZE):
                    clearance = min(clearance, pond.distance_to_hollow_edge(x, y))
            clearances[(x, y)] = clearance
    return clearances


def tree_fits(clearances, buckets, x, y, width, gap):
    radius = width / 2
    if abs(x) + radius > PARK_REACH - TREE_EDGE_MARGIN + 0.5 or abs(y) + radius > PARK_REACH - TREE_EDGE_MARGIN + 0.5:
        return False
    if clearances.get((x, y), -1) < radius + TREE_WATER_MARGIN:
        return False
    bucket_x, bucket_y = x // TREE_BUCKET_SIZE, y // TREE_BUCKET_SIZE
    return all(math.hypot(x - placed_x, y - placed_y) >= radius + placed_width / 2 + gap
               for neighbour_x in (bucket_x - 1, bucket_x, bucket_x + 1)
               for neighbour_y in (bucket_y - 1, bucket_y, bucket_y + 1)
               for placed_x, placed_y, placed_width in buckets.get((neighbour_x, neighbour_y), []))


def place_tree(placed, buckets, x, y, width):
    placed.append((x, y, width))
    buckets.setdefault((x // TREE_BUCKET_SIZE, y // TREE_BUCKET_SIZE), []).append((x, y, width))


def tree_color():
    green = random.randint(0x6d, 0xf2)
    side = int(green * random.uniform(0.13, 0.2))
    return f'#{side:02x}{green:02x}{side:02x}'


def number(value):
    return f'{value:g}'


if __name__ == '__main__':
    main()
