# Generates the "middle" elevation triangles: frontend/src/assets/terrain/grassland/elevations/middle/<edge><variant>.sgl
#
# For each variant and each edge, a whole outcrop square is generated with a pile of rocks rising towards that edge
# (like the "Neighbouring elevation" example in frontend/src/assets/terrain.md), so that the neighbouring square's
# pile towards the opposite edge reads as the same mountain. Only the triangle facing that edge is kept.
#
# Run from anywhere: python3 tools/sgl/generator/terrain/middle_elevations.py
import math
import os
import random
import re

from outcrop import (random_rock, rock_color, random_tree_color, tree_size, rock_line, top_of, roof_under,
                     circle, inside, rock_geometry)

TILE_EDGE = 50
PILE_REACH = 38
LOW_ROCK_TOP = 10.75
VARIANTS = 10
SEED = 9044
# Outward unit vector of each high edge.
EDGE_DIRECTIONS = {'e': (1, 0), 's': (0, 1), 'w': (-1, 0), 'n': (0, -1)}
OUTPUT_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..',
                                'frontend', 'src', 'assets', 'terrain', 'grassland', 'elevations', 'middle')


def main():
    random.seed(SEED)
    for variant in range(VARIANTS):
        for edge_name, direction in EDGE_DIRECTIONS.items():
            kept = [line for line in whole_square(direction) if triangle(line) == edge_name]
            with open(os.path.join(OUTPUT_DIRECTORY, f'{edge_name}{variant}.sgl'), 'w') as output:
                output.write('\n'.join(kept) + '\n')
            print(f'{edge_name}{variant}: {len(kept)} lines')


def whole_square(direction):
    while True:
        core = [random_rock(False) for _ in range(4)] + [random_rock(True) for _ in range(4)]
        if all(abs(value) <= 48 for rock in core for corner in rock_geometry(*rock[:3])[2] for value in corner):
            break
    peak = max(top_of(rock) for rock in core)
    while True:
        edge_row = [pressed_rock(direction, along, (28, 36) if abs(along) < 20 else (26, 32), (0, 2), TILE_EDGE,
                                 peak - 0.5)
                    for along in (-26, -14, -4, 6, 16, 27)]
        middle_row = [pressed_rock(direction, along, (26, 34), (0, 2), random.randint(36, 40), peak - 5)
                      for along in (-20, -5, 10, 22)]
        pile = middle_row + edge_row
        if (all(abs(sideways_of(corner, direction)) <= 48
                for rock in pile for corner in rock_geometry(*rock[:3])[2])
                and all(top_of(rock) <= peak for rock in pile)):
            break
    rocks = core + pile
    rocks_geometry = [rock_geometry(*rock[:3]) for rock in rocks]
    trees = []
    ground_trees = place_ground_trees(rocks, rocks_geometry, trees)
    roof_trees = place_roof_trees(rocks_geometry, trees)
    return [rock_line(rock) for rock in core + middle_row + edge_row] + ground_trees + roof_trees


def pressed_rock(direction, along, size_range, top_offset_range, outward_target, highest):
    # A pile rock at a position along the edge, lowered so its top falls away towards the side edges,
    # then slid outwards: over the tile edge until a whole side reaches it, or up to outward_target.
    direction_x, direction_y = direction
    along = along + random.randint(-3, 3)
    rock = [[random.randint(*size_range), random.randint(*size_range), 30],
            [35 * direction_x - along * direction_y, 35 * direction_y + along * direction_x, random.choice([-5, 0])],
            [random.randint(-20, 140), random.randint(-8, 11), random.choice([-5, 0, 0])],
            rock_color()]
    wanted_top = max(LOW_ROCK_TOP, falling_top(along, highest) - random.uniform(*top_offset_range))
    while rock[0][2] > 5 and top_of(rock) > wanted_top:
        rock[0][2] -= 1
    top, bottom, rock_hull = rock_geometry(*rock[:3])
    if outward_target == TILE_EDGE:
        side_corner = min(sorted((outward_of(corner, direction) for corner in face), reverse=True)[1]
                          for face in (top, bottom))
        shift = math.ceil(TILE_EDGE - side_corner)
    else:
        shift = math.floor(outward_target - max(outward_of(corner, direction) for corner in rock_hull))
    rock[1][0] += shift * direction_x
    rock[1][1] += shift * direction_y
    top, bottom, rock_hull = rock_geometry(*rock[:3])
    highest_sideways = max(sideways_of(corner, direction) for corner in rock_hull)
    lowest_sideways = min(sideways_of(corner, direction) for corner in rock_hull)
    sideways_shift = 0
    if highest_sideways > PILE_REACH:
        sideways_shift = math.floor(PILE_REACH - highest_sideways)
    if lowest_sideways < -PILE_REACH:
        sideways_shift = math.ceil(-PILE_REACH - lowest_sideways)
    rock[1][0] -= sideways_shift * direction_y
    rock[1][1] += sideways_shift * direction_x
    return rock


def falling_top(along, highest):
    # Tops fall away from the middle of the edge towards the side edges, down to a low rock's height.
    closeness = max(0, 1 - abs(along) / 34)
    return LOW_ROCK_TOP + (highest - LOW_ROCK_TOP) * closeness ** 0.8


def outward_of(point, direction):
    return point[0] * direction[0] + point[1] * direction[1]


def sideways_of(point, direction):
    return -point[0] * direction[1] + point[1] * direction[0]


def place_ground_trees(rocks, rocks_geometry, trees):
    lines = []
    target = random.randint(22, 26)
    attempts = 0
    while len(trees) < target and attempts < 20000:
        attempts += 1
        width, height = tree_size()
        radius = width / 2
        limit = int(48 - radius)
        x = random.randint(-limit, limit)
        y = random.randint(-limit, limit)
        if any(math.hypot(x - rock[1][0], y - rock[1][1]) < 15 * math.sqrt(2) for rock in rocks):
            continue
        if any(inside(geometry[2], sample_x, sample_y)
               for geometry in rocks_geometry for sample_x, sample_y in circle(x, y, radius + 1)):
            continue
        if overlaps_tree(x, y, radius, trees):
            continue
        trees.append((x, y, radius))
        lines.append(f"sph s({width},{width},{height}) t({x},{y},7) c(#{random_tree_color()})")
    return lines


def place_roof_trees(rocks_geometry, trees):
    lines = []
    target = random.randint(9, 12)
    attempts = 0
    while len(lines) < target and attempts < 40000:
        attempts += 1
        width, height = tree_size()
        radius = width / 2
        x = random.randint(-48, 48)
        y = random.randint(-48, 48)
        surface = roof_under(rocks_geometry, x, y, radius)
        if surface is None:
            continue
        if overlaps_tree(x, y, radius, trees):
            continue
        trees.append((x, y, radius))
        lines.append(f"sph s({width},{width},{height}) t({x},{y},{round(surface - 0.075 * height)}) "
                     f"c(#{random_tree_color()})")
    return lines


def overlaps_tree(x, y, radius, trees):
    return any(math.hypot(x - tree_x, y - tree_y) < radius + tree_radius + 1 for tree_x, tree_y, tree_radius in trees)


def triangle(line):
    # Which of the four triangles (cut by the square's diagonals) the body's centre is in.
    # A centre on a diagonal belongs to the triangle owning that edge clockwise; the centre point belongs to 'e'.
    x, y = [int(value) for value in re.search(r't\((-?\d+),(-?\d+),', line).groups()]
    if x == 0 and y == 0:
        return 'e'
    if y > abs(x) or (x == y and x > 0):
        return 's'
    if x > abs(y) or (y == -x and x > 0):
        return 'e'
    if y < -abs(x) or (x == y and x < 0):
        return 'n'
    return 'w'


if __name__ == '__main__':
    main()
