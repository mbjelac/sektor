# Writes the construction of every park variant: <variant>.construction.sgl next to each <variant>.sgl in the Park
# folder, the same park, only with its trees coming up while it is being built.
#
# The trees are dealt at random into GROUPS groups of as near the same size as they come, with no regard for where they
# stand, so the park fills in all over at once rather than from one side. The group with index g (1 to GROUPS) shows
# up GROUP_DELAY·g ms after the construction starts and stays SHOWN ms, which outlasts the Park's construction of
# 2 s; after that the finished park stands in its place. Everything other than the trees is there from the start.
#
# One seed for each variant, so rerunning rewrites the same files, and regenerating one park leaves the others alone.
#
# Run from anywhere:
#   python3 tools/sgl/generator/park/park_constructions.py
import pathlib
import random
import re

PARK_FOLDER = pathlib.Path(__file__).resolve().parents[4] / 'frontend/src/assets/buildings/Park'
VARIANT_FILE = re.compile(r'^(\d+)\.sgl$')
TREE = re.compile(r'^sph ')
GROUPS = 10
GROUP_DELAY = 200
SHOWN = 2000


def main():
    variants = sorted(int(match.group(1)) for path in PARK_FOLDER.iterdir()
                      if (match := VARIANT_FILE.match(path.name)))
    for variant in variants:
        park = (PARK_FOLDER / f'{variant}.sgl').read_text()
        (PARK_FOLDER / f'{variant}.construction.sgl').write_text(construction(park, variant))
    print(f'wrote {len(variants)} constructions to {PARK_FOLDER}')


def construction(park, variant):
    lines = park.split('\n')
    tree_line_indices = [index for index, line in enumerate(lines) if TREE.match(line)]
    randomness = random.Random(variant)
    randomness.shuffle(tree_line_indices)
    for dealt, line_index in enumerate(tree_line_indices):
        group_index = dealt % GROUPS + 1
        lines[line_index] = f'{lines[line_index].rstrip()} ashow({GROUP_DELAY * group_index},{SHOWN})'
    return '\n'.join(lines)


if __name__ == '__main__':
    main()
