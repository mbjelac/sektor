"""Writes Agriplot variants 1-9 (<n>.sgl and <n>.construction.sgl) into
frontend/src/assets/buildings/Agriplot/. Variant 0 is hand-made and left alone.

Every variant has the same 9 crop sections of 6 rows each, laid out as in 0.sgl. Per variant:
- each section gets its own shade of the crop green #1c750b: only the lightness varies, 9 levels
  evenly from 15% to 35%, dealt to the sections at random;
- 2-5 random sections are rows of spheres, the rest are cylinders.

A cylinder row is a cyl 4 across lying along the row, half sunk (its axis at z 0). A sphere row
is s(4) spheres, also half sunk, from one end of the cylinder it replaces to the other, ~3.7
apart so they are closer within a row than the rows (5 apart) are to each other.

The construction shows each section at its fixed start and raises it 2.05 out of the ground in
200 ms, like 0.construction.sgl. The last section starts at 1800, so every variant fits
duration=2200 in buildings.md.

Seeded by the variant number; rerunning reproduces the files.
"""
import colorsys
import os
import random

OUTPUT_DIRECTORY = os.path.join(os.path.dirname(__file__), '../../../../frontend/src/assets/buildings/Agriplot')
VARIANTS = range(1, 10)

BUILDING_HEADER = [
    'pri4 s(13,13,8) t(-11,-11,-6.9) c(#d3c097) r(0,0,0)',
    'pri6 s(9,9,16) t(-11,-11,-10.3) r(16,0,0) c(#7aaea3)',
]
CONSTRUCTION_HEADER = [
    'pri4 s(13,13,8) t(-11,-11,-6.9) c(#d3c097) r(0,0,0)',
    'pri6 s(9,9,16) t(-11,-11,-16.1) r(16,0,0) c(#7aaea3) at1(0,0,5.8,1000,10000)',
]

# Each row is (spin, length, x, y): spin 0 lies along y, spin 90 along x; (x, y) is its middle.
SECTIONS = [
    [(0, 30, x, -32.25) for x in (2, 7, -3, 12, -8, -13)],
    [(0, 30, x, 32.75) for x in (2, 7, -3, 12, -8, -13)],
    [(0, 30, x, -0.25) for x in (29, 34, 39, 24, 44, 19)],
    [(0, 30, x, -0.25) for x in (-20, -25, -30, -35, -40, -45)],
    [(90, 30, -31.25, y) for y in (-45, -40, -35, -30, -25, -20)],
    [(90, 30, 30.75, y) for y in (-45, -40, -35, -30, -25, -20)],
    [(90, 30, -31.25, y) for y in (45, 40, 35, 30, 25, 20)],
    [(90, 30, 30.75, y) for y in (45, 40, 35, 30, 25, 20)],
    [(90, 20, 4.5, -13), (90, 20, 4.5, -8)] + [(90, 30, -0.25, y) for y in (-3, 2, 7, 12)],
]
SECTION_STARTS = [1100, 1600, 1700, 1400, 1000, 1800, 1300, 1200, 1500]

CROP_COLOR = (0x1c, 0x75, 0x0b)
LIGHTNESSES = [0.15 + level * 0.025 for level in range(9)]
MIN_SPHERE_SECTIONS = 2
MAX_SPHERE_SECTIONS = 5
DIAMETER = 4
SPHERE_SPACING = 3.7
RISE = 2.05  # crop tops are at z 2; the construction starts them at -0.05, just under the floor
RISE_TIME = 200


def main():
    for variant in VARIANTS:
        sections = random_sections(random.Random(variant))
        write(f'{variant}.sgl', BUILDING_HEADER + [line for section in sections for line in section_lines(section, 0)])
        construction = list(CONSTRUCTION_HEADER)
        for section in sections:
            construction.append('')
            start = section['start']
            construction += [f'{line} ashow({start},10000) at1(0,0,{number(RISE)},{RISE_TIME},10000,{start})'
                             for line in section_lines(section, -RISE)]
        write(f'{variant}.construction.sgl', construction)
        sphere_sections = [index for index, section in enumerate(sections) if section['spheres']]
        print(f'{variant}: spheres in sections {sphere_sections}, colors {[section["color"] for section in sections]}')


def random_sections(generator):
    lightnesses = generator.sample(LIGHTNESSES, len(LIGHTNESSES))
    sphere_count = generator.randint(MIN_SPHERE_SECTIONS, MAX_SPHERE_SECTIONS)
    sphere_sections = set(generator.sample(range(len(SECTIONS)), sphere_count))
    return [{'rows': rows, 'start': start, 'color': shade(lightness), 'spheres': index in sphere_sections}
            for index, (rows, start, lightness) in enumerate(zip(SECTIONS, SECTION_STARTS, lightnesses))]


def shade(lightness):
    hue, _, saturation = colorsys.rgb_to_hls(*(channel / 255 for channel in CROP_COLOR))
    return '#%02x%02x%02x' % tuple(round(channel * 255) for channel in colorsys.hls_to_rgb(hue, lightness, saturation))


def section_lines(section, depth):
    lines = []
    for spin, length, x, y in section['rows']:
        if section['spheres']:
            lines += sphere_row(spin, length, x, y, section['color'], depth)
        else:
            lines.append(f'cyl r({spin},90,0) s({DIAMETER},{DIAMETER},{length}) '
                         f't({number(x)},{number(y)},{number(-length / 2 + depth)}) c({section["color"]})')
    return lines


def sphere_row(spin, length, x, y, color, depth):
    span = length - DIAMETER
    count = round(span / SPHERE_SPACING) + 1
    spacing = span / (count - 1)
    lines = []
    for index in range(count):
        offset = -span / 2 + index * spacing
        sphere_x, sphere_y = (x, y + offset) if spin == 0 else (x + offset, y)
        lines.append(f'sph s({DIAMETER}) t({number(sphere_x)},{number(sphere_y)},{number(-DIAMETER / 2 + depth)}) c({color})')
    return lines


def number(value):
    return ('%.3f' % value).rstrip('0').rstrip('.')


def write(name, lines):
    with open(os.path.join(OUTPUT_DIRECTORY, name), 'w') as file:
        file.write('\n'.join(lines) + '\n')


if __name__ == '__main__':
    main()
