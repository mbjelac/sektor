# Makes the forested and grassland elevations of the polar, temperate and tropical biomes:
# frontend/src/assets/terrain/<biome>/elevations/<forested|grasslands>/<edge|middle>/<name>.sgl
#
# Both start as copies of the same elevations. Forested ones get twice as many trees: every tree gets a new one next to
# it, of its size and in the colour of another tree of the file, standing on the same kind of place as it — the
# ground, or a rock roof at the same height above the roof — and inside the triangle of the square its file draws.
# Grassland ones keep a random half of their trees. Rocks are never touched. A tree in one triangle can stand on a
# rock kept in a neighbouring triangle, so the rocks of all four files of a variant are looked at.
#
# The script works on the files in place, so every run changes what the last one wrote. The forested files are the
# original trees doubled twice (two runs of forested), the grasslands ones one run of grasslands:
#   python3 tools/sgl/generator/terrain/elevation_covers.py forested
#   python3 tools/sgl/generator/terrain/elevation_covers.py grasslands
import math
import os
import random
import re
import sys

from outcrop import rock_geometry, roof_under, roof_height, inside, circle
from tropical_elevations import parse, number, boulder_top

SEED = 4417
BIOMES = ['polar', 'temperate', 'tropical']
KINDS = ['edge', 'middle']
TREE_KEPT = 0.5
# Trees standing at least this high are on a rock roof; the rest are on the ground.
ROOF_TREE_HEIGHT = 1
# A new tree stands this far from the tree it grew next to, in parts of the two crowns' radii added up.
NEIGHBOUR_DISTANCE = (0.7, 1.1)
# No two trees stand closer than this part of their radii added up, or one would swallow the other.
CLOSEST = 0.5
# How many spots next to a tree are tried before another tree of the file is grown next to instead.
SPOTS_TRIED = 100
SQUARE_REACH = 50
TERRAIN_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..',
                                 'frontend', 'src', 'assets', 'terrain')


def main():
    cover = sys.argv[1]
    random.seed(SEED)
    for biome in BIOMES:
        for kind in KINDS:
            directory = os.path.join(TERRAIN_DIRECTORY, biome, 'elevations', cover, kind)
            files = {}
            for file_name in sorted(os.listdir(directory)):
                with open(os.path.join(directory, file_name)) as source:
                    files[file_name] = source.read().splitlines()
            for file_name, lines in files.items():
                variant_rocks = [line for other_name, other_lines in files.items() if other_name[1:] == file_name[1:]
                                 for line in other_lines if is_rock(line)]
                ground = Ground(biome, variant_rocks)
                covered = forested(lines, file_name[0], ground) if cover == 'forested' else grasslands(lines)
                with open(os.path.join(directory, file_name), 'w') as output:
                    output.write('\n'.join(covered) + '\n')
                print(f'{biome}/{cover}/{kind}/{file_name}: {count_trees(lines)} -> {count_trees(covered)} trees')


def is_rock(line):
    # Rocks are pri5 bodies (not the snow caps lying on them) or, in the tropics, turned sph boulders.
    return (line.startswith('pri5 ') and ' sh(' not in line) or (line.startswith('sph ') and ' r(' in line)


def is_tree(line):
    return line.startswith('sph ') and ' r(' not in line


def count_trees(lines):
    return sum(1 for line in lines if is_tree(line))


def grasslands(lines):
    return [line for line in lines if not is_tree(line) or random.random() < TREE_KEPT]


def forested(lines, side, ground):
    trees = [parse(line) for line in lines if is_tree(line)]
    standing = [(tree[1][0], tree[1][1], tree[0][0] / 2) for tree in trees]
    new_lines = []
    for tree in trees:
        new_tree = None
        for parent in [tree] + random.sample(trees, len(trees)):
            new_tree = tree_next_to(parent, side, ground, standing)
            if new_tree:
                break
        if not new_tree:
            print(f'  no room for a tree next to {tree}')
            continue
        scale, position, color = new_tree
        standing.append((position[0], position[1], scale[0] / 2))
        new_lines.append(f"sph s({scale[0]},{scale[1]},{scale[2]}) "
                         f"t({number(position[0])},{number(position[1])},{number(position[2])}) "
                         f"c(#{random.choice(trees)[3]})")
    return lines + new_lines


def tree_next_to(parent, side, ground, standing):
    scale, position, rotation, color = parent
    x, y, z = position
    radius = scale[0] / 2
    on_roof = z >= ROOF_TREE_HEIGHT
    height_above = z - (ground.roof_at(x, y) if on_roof else 0)
    for attempt in range(SPOTS_TRIED):
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(*NEIGHBOUR_DISTANCE) * 2 * radius
        new_x, new_y = round(x + distance * math.cos(angle)), round(y + distance * math.sin(angle))
        if not in_triangle(side, new_x, new_y, radius):
            continue
        if any(math.hypot(new_x - other_x, new_y - other_y) < CLOSEST * (radius + other_radius)
               for other_x, other_y, other_radius in standing):
            continue
        if on_roof:
            roof = ground.roof_under(new_x, new_y, radius)
            if roof is None:
                continue
            new_z = roof + height_above
        else:
            if not ground.is_open(new_x, new_y, radius):
                continue
            new_z = z
        return scale, (new_x, new_y, new_z), color
    return None


def in_triangle(side, x, y, radius):
    if abs(x) > SQUARE_REACH - radius or abs(y) > SQUARE_REACH - radius:
        return False
    return {'n': y <= -abs(x), 's': y >= abs(x), 'e': x >= abs(y), 'w': x <= -abs(y)}[side]


class Ground:
    # The rocks of a variant, and what stands on them: pri5 roofs, or in the tropics the tops of sph boulders.

    def __init__(self, biome, rock_lines):
        self.rocks = [parse(line) for line in rock_lines]
        self.boulders = biome == 'tropical'
        self.geometry = [] if self.boulders else [rock_geometry(*rock[:3]) for rock in self.rocks]

    def roof_at(self, x, y):
        # Height of the highest roof straight under (x, y); 0 when (x, y) is over no roof at all.
        if self.boulders:
            return max([boulder_top(rock, x, y) for rock in self.rocks] + [0])
        roofs = ([roof_height(top, x, y) for top, bottom, rock_hull in self.geometry if inside(top, x, y)]
                 or [roof_height(top, x, y) for top, bottom, rock_hull in self.geometry if inside(rock_hull, x, y)])
        return max(roofs, default=0)

    def roof_under(self, x, y, radius):
        # Height of the roof under a crown of this radius at (x, y), or None when its footprint is not all on rock.
        if self.boulders:
            if not all(max([boulder_top(rock, sample_x, sample_y) for rock in self.rocks], default=0) > ROOF_TREE_HEIGHT
                       for sample_x, sample_y in circle(x, y, radius)):
                return None
            return self.roof_at(x, y)
        return roof_under(self.geometry, x, y, radius)

    def is_open(self, x, y, radius):
        # Whether a crown of this radius at (x, y) stands on the ground clear of every rock.
        samples = circle(x, y, radius)
        if self.boulders:
            return all(boulder_top(rock, sample_x, sample_y) <= 0
                       for rock in self.rocks for sample_x, sample_y in samples)
        return not any(inside(rock_hull, sample_x, sample_y)
                       for top, bottom, rock_hull in self.geometry for sample_x, sample_y in samples)


if __name__ == '__main__':
    main()
