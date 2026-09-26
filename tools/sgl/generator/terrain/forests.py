# Generates forest squares: frontend/src/assets/terrain/temperate/forests/<variant>.sgl
#
# Each is a square of sph trees standing on the ground, packed so that neighbouring crowns touch or overlap a little;
# a gap between neighbours is the exception. Each tree goes to the best of a few random spots: the one leaving it
# the most room, which spreads the trees evenly without a grid.
#
# Run from anywhere: python3 tools/sgl/generator/terrain/forests.py
import math
import os
import random

from outcrop import random_tree_color, tree_size

TREES = 178
VARIANTS = 10
SIZE_INCREASE = 2
CANDIDATES = 12
GROUND_Z = 7
SQUARE_REACH = 50
SEED = 3171
OUTPUT_DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..',
                                'frontend', 'src', 'assets', 'terrain', 'temperate', 'forests')


def main():
    random.seed(SEED)
    for variant in range(VARIANTS):
        lines = forest()
        with open(os.path.join(OUTPUT_DIRECTORY, f'{variant}.sgl'), 'w') as output:
            output.write('\n'.join(lines) + '\n')
        print(f'{variant}: {len(lines)} lines')


def forest():
    lines = []
    trees = []
    for _ in range(TREES):
        width, height = [dimension + SIZE_INCREASE for dimension in tree_size()]
        radius = width / 2
        candidates = [(random.randint(-SQUARE_REACH, SQUARE_REACH), random.randint(-SQUARE_REACH, SQUARE_REACH)) for _ in range(CANDIDATES)]
        x, y = max(candidates, key=lambda candidate: room(candidate, radius, trees))
        trees.append((x, y, radius))
        lines.append(f"sph s({width},{width},{height}) t({x},{y},{GROUND_Z}) c(#{random_tree_color()})")
    return lines


def room(candidate, radius, trees):
    # The gap between this tree's crown and the nearest neighbour's crown; negative when they overlap.
    # The square's edge counts as a neighbouring crown, so trees do not crowd into the free space along it.
    x, y = candidate
    edge_room = SQUARE_REACH - max(abs(x), abs(y)) - radius
    return min([math.hypot(x - tree_x, y - tree_y) - radius - tree_radius for tree_x, tree_y, tree_radius in trees]
               + [edge_room])


if __name__ == '__main__':
    main()
