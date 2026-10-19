# Generates the polar elevations: frontend/src/assets/terrain/polar/elevations/<edge|middle>/<name>.sgl
#
# Each is made from the temperate elevation of the same name: the pri5 rocks grow taller and a bit darker, and each
# gets a thin, shiny white cap of snow on its top face. The cap is turned about the rock's centre (with ro), so it tilts
# along with the rock and lies flat on its top. Trees are thinned out, made narrower and a dark polar green; a tree
# that stood on a rock roof is lifted onto the snow on the taller rock's roof. A tree in one triangle can stand on a
# rock kept in a neighbouring triangle, so the rocks of all four files of a variant are looked at.
#
# Run from anywhere: python3 tools/sgl/generator/terrain/polar_elevations.py
import os
import random

from outcrop import rock_geometry, inside, roof_height, blend
from tropical_elevations import parse, number

SEED = 5127
ROCK_GROWTH = (1.5, 2)
ROCK_DARKENING = 0.85
SNOW_HEIGHT = 2
# The snow cap stands this much above the rock's top, and this much wider, so the rock does not show through it.
SNOW_LIFT = 0.2
SNOW_OVERHANG = 1
SNOW_COLOR = 'ffffff'
# Snow glows and glares, so that it stays white even on the faces turned away from the light.
SNOW_SHINE = 90
TREE_KEPT = 0.5
TREE_NARROWING = 0.6
TREE_COLOR_LOW = (0x00, 0x3b, 0x23)
TREE_COLOR_HIGH = (0x00, 0xcc, 0x7a)
# Trees standing at least this high are on a rock roof; the rest are on the ground.
ROOF_TREE_HEIGHT = 1
TERRAIN_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..',
                                 'frontend', 'src', 'assets', 'terrain')
KINDS = ['edge', 'middle']


def main():
    random.seed(SEED)
    for kind in KINDS:
        temperate_directory = os.path.join(TERRAIN_DIRECTORY, 'temperate', 'elevations', kind)
        polar_directory = os.path.join(TERRAIN_DIRECTORY, 'polar', 'elevations', kind)
        files = {}
        for file_name in sorted(os.listdir(temperate_directory)):
            with open(os.path.join(temperate_directory, file_name)) as source:
                files[file_name] = source.read().splitlines()
        taller = {(file_name, index): taller_rock(parse(line))
                  for file_name, lines in files.items() for index, line in enumerate(lines) if line.startswith('pri5 ')}
        for file_name, lines in files.items():
            variant_rocks = [rock for (other_name, index), rock in taller.items() if other_name[1:] == file_name[1:]]
            polar = []
            for index, line in enumerate(lines):
                if line.startswith('pri5 '):
                    polar += rock_lines(taller[(file_name, index)])
                elif line.startswith('sph '):
                    polar += tree_lines(parse(line), variant_rocks)
                else:
                    polar.append(line)
            with open(os.path.join(polar_directory, file_name), 'w') as output:
                output.write('\n'.join(polar) + '\n')
            print(f'{kind}/{file_name}: {len(lines)} -> {len(polar)} lines')


def taller_rock(rock):
    scale, position, rotation, color = rock
    height = round(scale[2] * random.uniform(*ROCK_GROWTH))
    darker = ''.join('%02x' % round(channel * ROCK_DARKENING) for channel in bytes.fromhex(color))
    return [scale[0], scale[1], height], position, rotation, darker


def rock_lines(rock):
    scale, position, rotation, color = rock
    x, y, z = position
    # The cap's centre sits (height − snow height)/2 + lift above the rock's centre; ro points back down to it.
    pivot_drop = (scale[2] - SNOW_HEIGHT) / 2 + SNOW_LIFT
    turn = f"r({rotation[0]},{rotation[1]},{rotation[2]})"
    return [f"pri5 s({scale[0]},{scale[1]},{scale[2]}) t({number(x)},{number(y)},{number(z)}) {turn} c(#{color})",
            f"pri5 s({scale[0] + SNOW_OVERHANG},{scale[1] + SNOW_OVERHANG},{SNOW_HEIGHT}) "
            f"t({number(x)},{number(y)},{number(z + scale[2] - SNOW_HEIGHT + SNOW_LIFT)}) {turn} "
            f"ro(0,0,{number(-pivot_drop)}) c(#{SNOW_COLOR}) sh({SNOW_SHINE})"]


def tree_lines(tree, rocks):
    scale, position, rotation, color = tree
    x, y, z = position
    if random.random() >= TREE_KEPT:
        return []
    if z >= ROOF_TREE_HEIGHT:
        # The roofs right under the tree, or, when tilting the taller rocks slid every roof off it, those it is
        # still over the side of.
        rocks_geometry = [rock_geometry(*rock[:3]) for rock in rocks]
        roofs = ([roof_height(top, x, y) for top, bottom, rock_hull in rocks_geometry if inside(top, x, y)]
                 or [roof_height(top, x, y) for top, bottom, rock_hull in rocks_geometry if inside(rock_hull, x, y)])
        if not roofs:
            return []
        z = max(roofs) + SNOW_LIFT
    elif any(inside(rock_geometry(*rock[:3])[2], x, y) for rock in rocks):
        return []
    width = max(2, round(scale[0] * TREE_NARROWING))
    tree_color = blend(TREE_COLOR_LOW, TREE_COLOR_HIGH, random.random())
    return [f"sph s({width},{width},{scale[2]}) t({number(x)},{number(y)},{number(z)}) c(#{tree_color})"]


if __name__ == '__main__':
    main()
