# Generates the desert elevations: frontend/src/assets/terrain/desert/elevations/<edge|middle>/<name>.sgl
#
# Each is made from the temperate elevation of the same name: the pri5 rocks become rocks standing on the same base,
# narrowed about their own centres, grown taller and coloured a random sandstone colour. Each is a pyr7 cut off with f()
# at the height the rock reaches, so it tapers towards a flat top. Half as many trees are kept, made smaller and a dry
# green; a tree that stood on a rock roof is set onto the flat top of the rock now under it. Trees that no longer have
# a top under them, or stand on the ground inside a rock, cannot be kept, so the kept ones are picked from the rest.
# Most of the kept ground trees are then moved up onto the top of the nearest rock of their own file that has room. A tree
# only ever stands on a rock of its own file: a square of rock is drawn from files of both kinds, so the rock of a
# neighbouring file may not be there to hold it up. The rocks of all four files of a variant are still looked at, so
# that a tree is not set where the rock of a neighbouring file would bury it.
#
# Run from anywhere: python3 tools/sgl/generator/terrain/desert_elevations.py
import math
import os
import random

from outcrop import blend, world, hull, inside, roof_height, roof_under
from tropical_elevations import parse, number

SEED = 4182
TREE_SEED = 6631
ROCK_NARROWING = 0.7
ROCK_GROWTH = 2
ROCK_SIDES = 7
# How much of the pyramid is cut off; its top is this percentage of its base wide.
ROCK_FRUSTUM = 50
ROCK_COLOR_LOW = (0xd1, 0xa5, 0x6b)
ROCK_COLOR_HIGH = (0xe0, 0xb6, 0x96)
TREE_KEPT = 0.5
TREE_SHRINKING = 0.5
TREE_MOVED_ONTO_ROCKS = 0.7
# Random spots tried on each rock's top for a tree being moved there.
ROOF_SPOT_ATTEMPTS = 40
TREE_COLOR_LOW = (0xcd, 0xd9, 0x9e)
TREE_COLOR_HIGH = (0x97, 0xb0, 0x61)
# Trees standing at least this high are on a rock roof; the rest are on the ground.
ROOF_TREE_HEIGHT = 1
TERRAIN_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..',
                                 'frontend', 'src', 'assets', 'terrain')
KINDS = ['edge', 'middle']


def main():
    random.seed(SEED)
    tree_random = random.Random(TREE_SEED)
    for kind in KINDS:
        temperate_directory = os.path.join(TERRAIN_DIRECTORY, 'temperate', 'elevations', 'forested', kind)
        desert_directory = os.path.join(TERRAIN_DIRECTORY, 'desert', 'elevations', kind)
        files = {}
        for file_name in sorted(os.listdir(temperate_directory)):
            with open(os.path.join(temperate_directory, file_name)) as source:
                files[file_name] = source.read().splitlines()
        rocks = {(file_name, index): desert_rock(parse(line))
                 for file_name, lines in files.items() for index, line in enumerate(lines) if line.startswith('pri5 ')}
        for file_name, lines in files.items():
            variant_rocks_geometry = [rock_geometry(*rock[:3]) for (other_name, index), rock in rocks.items()
                                      if other_name[1:] == file_name[1:]]
            file_rocks_geometry = [rock_geometry(*rock[:3]) for (other_name, index), rock in rocks.items()
                                   if other_name == file_name]
            standing = {index: standing_tree(parse(line), file_rocks_geometry, variant_rocks_geometry)
                        for index, line in enumerate(lines) if line.startswith('sph ')}
            standing = {index: tree for index, tree in standing.items() if tree}
            kept = set(tree_random.sample(sorted(standing),
                                          min(len(standing), round(len(tree_lines_of(lines)) * TREE_KEPT))))
            standing = {index: shrunk(tree) for index, tree in standing.items() if index in kept}
            move_onto_rocks(standing, file_rocks_geometry, variant_rocks_geometry, tree_random)
            desert = []
            for index, line in enumerate(lines):
                if line.startswith('pri5 '):
                    desert.append(rock_line(rocks[(file_name, index)]))
                elif line.startswith('sph '):
                    if index in kept:
                        desert.append(tree_line(standing[index], tree_random))
                else:
                    desert.append(line)
            with open(os.path.join(desert_directory, file_name), 'w') as output:
                output.write('\n'.join(desert) + '\n')
            print(f'{kind}/{file_name}: {len(lines)} -> {len(desert)} lines')


def desert_rock(rock):
    scale, position, rotation, color = rock
    width = max(1, round(scale[0] * ROCK_NARROWING))
    depth = max(1, round(scale[1] * ROCK_NARROWING))
    rock_color = blend(ROCK_COLOR_LOW, ROCK_COLOR_HIGH, random.random())
    return [width, depth, scale[2] * ROCK_GROWTH], position, rotation, rock_color


def rock_geometry(scale, position, rotation):
    # Returns the rock's flat top corners, base corners (x, y, height) and its ground-plane outline. The scale's height
    # is the height of the cut-off rock, halfway up which it is turned.
    angles = [-math.pi / 2 + 2 * math.pi * index / ROCK_SIDES for index in range(ROCK_SIDES)]
    top_radius = 50 * ROCK_FRUSTUM / 100
    top = [world((top_radius * math.cos(angle), -100, top_radius * math.sin(angle)), scale, position, rotation)
           for angle in angles]
    bottom = [world((50 * math.cos(angle), 0, 50 * math.sin(angle)), scale, position, rotation) for angle in angles]
    return top, bottom, hull(top + bottom)


def rock_line(rock):
    scale, position, rotation, color = rock
    x, y, z = position
    # A pyramid cut with f(p) is only (1 − p/100) of its height tall, so it is made taller to reach the rock's height.
    # Its centre, which r turns it about, then stays halfway up the rock.
    pyramid_height = round(scale[2] / (1 - ROCK_FRUSTUM / 100))
    return (f"pyr{ROCK_SIDES} s({scale[0]},{scale[1]},{pyramid_height}) t({number(x)},{number(y)},{number(z)}) "
            f"r({rotation[0]},{rotation[1]},{rotation[2]}) f({ROCK_FRUSTUM}) c(#{color})")


def tree_lines_of(lines):
    return [line for line in lines if line.startswith('sph ')]


def standing_tree(tree, file_rocks_geometry, variant_rocks_geometry):
    # The tree where it now stands, or None when it has nowhere to stand.
    scale, position, rotation, color = tree
    x, y, z = position
    if z >= ROOF_TREE_HEIGHT:
        roofs = [roof_height(top, x, y) for top, bottom, rock_hull in file_rocks_geometry if inside(top, x, y)]
        if not roofs:
            return None
        return scale, [x, y, max(roofs)], rotation, color
    if any(inside(rock_hull, x, y) for top, bottom, rock_hull in variant_rocks_geometry):
        return None
    return tree


def shrunk(tree):
    scale, position, rotation, color = tree
    width = max(1, round(scale[0] * TREE_SHRINKING))
    height = max(1, round(scale[2] * TREE_SHRINKING))
    return [width, width, height], position, rotation, color


def move_onto_rocks(trees, file_rocks_geometry, variant_rocks_geometry, tree_random):
    ground_indexes = sorted(index for index, tree in trees.items() if tree[1][2] < ROOF_TREE_HEIGHT)
    moved_indexes = tree_random.sample(ground_indexes, round(len(ground_indexes) * TREE_MOVED_ONTO_ROCKS))
    for index in moved_indexes:
        scale, position, rotation, color = trees[index]
        roof_trees = [tree for other_index, tree in trees.items()
                      if other_index != index and tree[1][2] >= ROOF_TREE_HEIGHT]
        spot = roof_spot(position, scale[0] / 2, file_rocks_geometry, variant_rocks_geometry, roof_trees, tree_random)
        if spot:
            trees[index] = scale, spot, rotation, color


def roof_spot(position, radius, file_rocks_geometry, variant_rocks_geometry, roof_trees, tree_random):
    # A random spot on the top of the nearest rock with room for a tree of this radius, clear of the trees already
    # standing on rock tops, or None when no rock of the file has room.
    def distance(rock):
        top = rock[0]
        return math.hypot(sum(corner[0] for corner in top) / len(top) - position[0],
                          sum(corner[1] for corner in top) / len(top) - position[1])

    for top, bottom, rock_hull in sorted(file_rocks_geometry, key=distance):
        lowest_x, highest_x = min(corner[0] for corner in top), max(corner[0] for corner in top)
        lowest_y, highest_y = min(corner[1] for corner in top), max(corner[1] for corner in top)
        for attempt in range(ROOF_SPOT_ATTEMPTS):
            x = round(tree_random.uniform(lowest_x, highest_x), 1)
            y = round(tree_random.uniform(lowest_y, highest_y), 1)
            if not inside(top, x, y):
                continue
            if any(math.hypot(x - tree[1][0], y - tree[1][1]) < radius + tree[0][0] / 2 for tree in roof_trees):
                continue
            height = own_roof_under(file_rocks_geometry, variant_rocks_geometry, x, y, radius)
            if height is not None:
                return [x, y, height]
    return None


def own_roof_under(file_rocks_geometry, variant_rocks_geometry, x, y, radius):
    # Height of the roof of a rock of the tree's own file it can stand on, or None when there is none, or the rock of a
    # neighbouring file covers it.
    height = roof_under(variant_rocks_geometry, x, y, radius)
    if height is None or height != roof_under(file_rocks_geometry, x, y, radius):
        return None
    return height


def tree_line(tree, tree_random):
    scale, position, rotation, color = tree
    x, y, z = position
    tree_color = blend(TREE_COLOR_LOW, TREE_COLOR_HIGH, tree_random.random())
    return f"sph s({scale[0]},{scale[1]},{scale[2]}) t({number(x)},{number(y)},{number(z)}) c(#{tree_color})"


if __name__ == '__main__':
    main()
