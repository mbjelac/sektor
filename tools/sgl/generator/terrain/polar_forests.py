# Generates the polar forests: frontend/src/assets/terrain/polar/forests/<variant>.sgl
#
# Each is made from the temperate forest of the same name: every tree stands in the same place but is narrower and
# taller, like a conifer, and turns a dark polar green.
#
# Run from anywhere: python3 tools/sgl/generator/terrain/polar_forests.py
import os
import random
import re

from outcrop import blend

SEED = 4127
TREE_STRETCH = 1.5
TREE_COLOR_LOW = (0x00, 0x3b, 0x23)
TREE_COLOR_HIGH = (0x00, 0xcc, 0x7a)
TERRAIN_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..',
                                 'frontend', 'src', 'assets', 'terrain')
NUMBER = r'(-?\d+(?:\.\d+)?)'


def main():
    random.seed(SEED)
    temperate_directory = os.path.join(TERRAIN_DIRECTORY, 'temperate', 'forests')
    polar_directory = os.path.join(TERRAIN_DIRECTORY, 'polar', 'forests')
    for file_name in sorted(os.listdir(temperate_directory)):
        with open(os.path.join(temperate_directory, file_name)) as source:
            lines = source.read().splitlines()
        with open(os.path.join(polar_directory, file_name), 'w') as output:
            output.write('\n'.join(tree_line(line) if line.startswith('sph ') else line for line in lines) + '\n')
        print(f'{file_name}: {len(lines)} lines')


def tree_line(line):
    width, depth, height = [int(value) for value in re.search(r's\((-?\d+),(-?\d+),(-?\d+)\)', line).groups()]
    x, y, z = re.search(rf't\({NUMBER},{NUMBER},{NUMBER}\)', line).groups()
    tree_color = blend(TREE_COLOR_LOW, TREE_COLOR_HIGH, random.random())
    return (f"sph s({round(width / TREE_STRETCH)},{round(depth / TREE_STRETCH)},{round(height * TREE_STRETCH)}) "
            f"t({x},{y},{z}) c(#{tree_color})")


if __name__ == '__main__':
    main()
