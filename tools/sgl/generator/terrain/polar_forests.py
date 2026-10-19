# Generates the polar forests: frontend/src/assets/terrain/polar/forests/<variant>.sgl
#
# Each is made from the temperate forest of the same name: every tree stands in the same place with the same width,
# but is taller, like a conifer, and turns a muted polar green. Heights are spread wider than in the temperate forest:
# the shortest temperate tree becomes SHORTEST_TREE_HEIGHT, the tallest twice that, and the rest are interpolated
# linearly in between.
#
# Run from anywhere: python3 tools/sgl/generator/terrain/polar_forests.py
import os
import random
import re

from outcrop import blend

SEED = 4127
SHORTEST_TREE_HEIGHT = 10
TALLEST_TREE_HEIGHT = 2 * SHORTEST_TREE_HEIGHT
TREE_COLOR_LOW = (0x00, 0x57, 0x27)
TREE_COLOR_HIGH = (0x62, 0x9e, 0x7d)
TERRAIN_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..',
                                 'frontend', 'src', 'assets', 'terrain')
SCALE = r's\((-?\d+),(-?\d+),(-?\d+)\)'
NUMBER = r'(-?\d+(?:\.\d+)?)'


def main():
    random.seed(SEED)
    temperate_directory = os.path.join(TERRAIN_DIRECTORY, 'temperate', 'forests')
    polar_directory = os.path.join(TERRAIN_DIRECTORY, 'polar', 'forests')
    files = {}
    for file_name in sorted(os.listdir(temperate_directory)):
        with open(os.path.join(temperate_directory, file_name)) as source:
            files[file_name] = source.read().splitlines()
    temperate_heights = [int(re.search(SCALE, line).group(3)) for lines in files.values()
                         for line in lines if line.startswith('sph ')]
    height_range = (min(temperate_heights), max(temperate_heights))
    for file_name, lines in files.items():
        with open(os.path.join(polar_directory, file_name), 'w') as output:
            output.write('\n'.join(tree_line(line, height_range) if line.startswith('sph ') else line
                                   for line in lines) + '\n')
        print(f'{file_name}: {len(lines)} lines')


def tree_line(line, height_range):
    width, depth, height = [int(value) for value in re.search(SCALE, line).groups()]
    x, y, z = re.search(rf't\({NUMBER},{NUMBER},{NUMBER}\)', line).groups()
    lowest, highest = height_range
    polar_height = round(SHORTEST_TREE_HEIGHT +
                         (height - lowest) / (highest - lowest) * (TALLEST_TREE_HEIGHT - SHORTEST_TREE_HEIGHT))
    tree_color = blend(TREE_COLOR_LOW, TREE_COLOR_HIGH, random.random())
    return f"sph s({width},{depth},{polar_height}) t({x},{y},{z}) c(#{tree_color})"


if __name__ == '__main__':
    main()
