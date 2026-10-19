# Generates the tropical elevations: frontend/src/assets/terrain/tropical/elevations/forested/<edge|middle>/<name>.sgl
#
# Each is made from the temperate elevation of the same name: the pri5 rocks become darker sph boulders standing in
# the same place, and the trees grow bigger and turn a bright tropical green. A tree that stood on a flat pri5 roof
# is set onto the boulder's rounded top, sunk in a little so it does not float over the curve. A tree in one triangle
# can stand on a rock kept in a neighbouring triangle, so the boulders of all four files of a variant are looked at.
#
# Run from anywhere: python3 tools/sgl/generator/terrain/tropical_elevations.py
import os
import random
import re

from outcrop import world, blend

SEED = 7310
ROCK_DARKENING = 0.6
TREE_GROWTH = 1.5
TREE_SINK = 0.15
# Trees standing at least this high are on a rock roof; the rest are on the ground.
ROOF_TREE_HEIGHT = 1
TREE_COLOR_LOW = (0x3d, 0xbf, 0x00)
TREE_COLOR_HIGH = (0x51, 0xff, 0x00)
TERRAIN_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..',
                                 'frontend', 'src', 'assets', 'terrain')
KINDS = ['edge', 'middle']
NUMBER = r'(-?\d+(?:\.\d+)?)'


def main():
    random.seed(SEED)
    for kind in KINDS:
        temperate_directory = os.path.join(TERRAIN_DIRECTORY, 'temperate', 'elevations', 'forested', kind)
        tropical_directory = os.path.join(TERRAIN_DIRECTORY, 'tropical', 'elevations', 'forested', kind)
        files = {}
        for file_name in sorted(os.listdir(temperate_directory)):
            with open(os.path.join(temperate_directory, file_name)) as source:
                files[file_name] = source.read().splitlines()
        for file_name, lines in files.items():
            variant_rocks = [parse(line) for other_name, other_lines in files.items() if other_name[1:] == file_name[1:]
                             for line in other_lines if line.startswith('pri5 ')]
            with open(os.path.join(tropical_directory, file_name), 'w') as output:
                output.write('\n'.join(tropical(lines, variant_rocks)) + '\n')
            print(f'{kind}/{file_name}: {len(lines)} lines')


def tropical(lines, rocks):
    return [boulder_line(parse(line)) if line.startswith('pri5 ')
            else tree_line(parse(line), rocks) if line.startswith('sph ')
            else line
            for line in lines]


def parse(line):
    scale = [int(value) for value in re.search(r's\((-?\d+),(-?\d+),(-?\d+)\)', line).groups()]
    position = [float(value) for value in re.search(rf't\({NUMBER},{NUMBER},{NUMBER}\)', line).groups()]
    rotation_match = re.search(r'r\((-?\d+),(-?\d+),(-?\d+)\)', line)
    rotation = [int(value) for value in rotation_match.groups()] if rotation_match else [0, 0, 0]
    color = re.search(r'c\(#([0-9a-fA-F]{6})\)', line).group(1)
    return scale, position, rotation, color


def boulder_line(rock):
    scale, position, rotation, color = rock
    darker = ''.join('%02x' % round(channel * ROCK_DARKENING) for channel in bytes.fromhex(color))
    return (f"sph s({scale[0]},{scale[1]},{scale[2]}) t({number(position[0])},{number(position[1])},"
            f"{number(position[2])}) r({rotation[0]},{rotation[1]},{rotation[2]}) c(#{darker})")


def tree_line(tree, rocks):
    scale, position, rotation, color = tree
    width, height = round(scale[0] * TREE_GROWTH), round(scale[2] * TREE_GROWTH)
    x, y, z = position
    rounded_top = max([boulder_top(rock, x, y) for rock in rocks], default=float('-inf'))
    if z >= ROOF_TREE_HEIGHT and rounded_top > float('-inf'):
        z = rounded_top - TREE_SINK * height
    tree_color = blend(TREE_COLOR_LOW, TREE_COLOR_HIGH, random.random())
    return f"sph s({width},{width},{height}) t({number(x)},{number(y)},{number(z)}) c(#{tree_color})"


def boulder_top(rock, x, y):
    # Height of the boulder's surface straight above (x, y), or minus infinity when (x, y) is outside it.
    # The boulder is the unit sphere u carried to the world by the same affine map that places the rock's vertices,
    # with vertex = 50·u around the rock's centre: world = centre + matrix·u.
    scale, position, rotation = rock[:3]
    centre = world((0, -50, 0), scale, position, rotation)
    columns = [[world_axis - centre_axis for world_axis, centre_axis in
                zip(world(tuple(50 * (axis == index) + (-50 if axis == 1 else 0) for axis in range(3)),
                          scale, position, rotation), centre)]
               for index in range(3)]
    matrix = [[columns[column][row] for column in range(3)] for row in range(3)]
    inverse = inverted(matrix)
    offset = [x - centre[0], y - centre[1], -centre[2]]
    base = [sum(inverse[row][column] * offset[column] for column in range(3)) for row in range(3)]
    upward = [inverse[row][2] for row in range(3)]
    # |base + height·upward|² = 1
    quadratic = sum(value * value for value in upward)
    linear = 2 * sum(base_value * upward_value for base_value, upward_value in zip(base, upward))
    constant = sum(value * value for value in base) - 1
    discriminant = linear * linear - 4 * quadratic * constant
    if discriminant < 0:
        return float('-inf')
    return (-linear + discriminant ** 0.5) / (2 * quadratic)


def inverted(matrix):
    (a, b, c), (d, e, f), (g, h, i) = matrix
    determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
    cofactors = [[e * i - f * h, c * h - b * i, b * f - c * e],
                 [f * g - d * i, a * i - c * g, c * d - a * f],
                 [d * h - e * g, b * g - a * h, a * e - b * d]]
    return [[value / determinant for value in row] for row in cofactors]


def number(value):
    return f'{value:.3f}'.rstrip('0').rstrip('.') if value != int(value) else str(int(value))


if __name__ == '__main__':
    main()
