"""Writes <n>.construction.sgl next to every Composter variant <n>.sgl (0-9), built from it.

Everything starts at once:
- the silo rises out of the ground in 1 s as on Fertilizatron: only its hollow cylinder, with its
  grey base and scaffolding standing from the start; the dome, band and panel are left out;
- the brown-gray sections lie 2.5 lower, tops just under the floor, and rise 2.5 in 640 ms, one
  section after another 340 ms apart, in random order; their yellow boxes are left out;
- each blue pipe is split into 6 cylinders 5 long, from ring centre to ring centre; along each row
  a cylinder appears with the ring at its far end, 400 ms after the one before, from the row's west
  or south end; all pipe rows do it together.

All cylinders are done at 2000, 1 s after the silo: the last brown-gray section ends at
4·340 + 640 and the last pipe cylinder shows at 5·400. Every variant fits duration=2200 in
buildings.md.
Seeded by the variant number; rerun it after regenerating or editing any variant.
"""
import os
import random
import re

BUILDING_DIRECTORY = os.path.join(os.path.dirname(__file__), '../../../../frontend/src/assets/buildings/Composter')
VARIANTS = range(10)

SILO_RISE = 1000
SOIL_RISE = 640
SOIL_STEP = 340
SOIL_DROP = 2.5  # row tops from z 2 to -0.5, under the floor
PIPE_STEP = 400
PIPE_LENGTH = 30
SEGMENT_LENGTH = 5
SEGMENT_COUNT = PIPE_LENGTH // SEGMENT_LENGTH
SHOWN_TIME = 10000


def main():
    for variant in VARIANTS:
        with open(os.path.join(BUILDING_DIRECTORY, f'{variant}.sgl')) as file:
            sections = [section.split('\n') for section in file.read().strip().split('\n\n')]
        lines = construction_lines(sections, random.Random(variant))
        with open(os.path.join(BUILDING_DIRECTORY, f'{variant}.construction.sgl'), 'w') as file:
            file.write('\n'.join(lines) + '\n')


def construction_lines(sections, generator):
    silo = next(section for section in sections if any('c(#ffffff)' in line for line in section))
    pipe_sections = [section for section in sections if any('#2f80d8' in line for line in section)]
    soil_sections = [section for section in sections if section is not silo and section not in pipe_sections]
    lines = silo_lines(*translate(silo[0])[:2])
    for order, section in enumerate(generator.sample(soil_sections, len(soil_sections))):
        lines += [''] + soil_lines(section, order * SOIL_STEP)
    for section in pipe_sections:
        lines += [''] + pipe_lines(section)
    return lines


def silo_lines(x, y):
    lines = [
        f'cyl s(10,10,20) t({number(x)},{number(y)},-18.5) c(#ffffff) h(70) at1(0,0,18.5,{SILO_RISE},{SHOWN_TIME},0)',
        f'cyl s(12,12,2) t({number(x)},{number(y)},-0.35) c(#c0c0c0)',
        '',
    ]
    for post_x, post_y in ((8, 0), (-8, 0), (0, 8), (0, -8)):
        lines.append(f'pri4 s(2,2,28.5) t({number(x + post_x)},{number(y + post_y)},-1) c(#b64d07)')
    for bar_x, bar_y, size in ((4.35, 0, '12.3,2,2'), (-4.35, 0, '12.3,2,2'), (0, 4.35, '2,12.3,2'), (0, -4.35, '2,12.3,2')):
        lines.append(f'pri4 s({size}) t({number(x + bar_x)},{number(y + bar_y)},26.5) c(#b64d07)')
    return lines


def soil_lines(section, start):
    lines = []
    for line in section:
        if '#f2b705' in line:
            continue
        x, y, z = translate(line)
        lowered = re.sub(r't\([^)]*\)', f't({number(x)},{number(y)},{number(z - SOIL_DROP)})', line)
        lines.append(f'{lowered} at(0,0,{SOIL_DROP},{SOIL_RISE},{SHOWN_TIME},{start})')
    return lines


def pipe_lines(section):
    lines = []
    for line in section:
        if f's(4.6,4.6,{PIPE_LENGTH})' not in line:
            continue
        spin = int(re.search(r'r\((\d+),', line).group(1))
        x, y, _ = translate(line)
        for index in range(SEGMENT_COUNT):
            segment_start = -PIPE_LENGTH / 2 + index * SEGMENT_LENGTH
            show = index * PIPE_STEP
            segment_x, segment_y = along_row(spin, x, y, segment_start + SEGMENT_LENGTH / 2)
            lines.append(f'cyl r({spin},90,0) s(4.6,4.6,{SEGMENT_LENGTH}) t({number(segment_x)},{number(segment_y)},{number(-SEGMENT_LENGTH / 2)}) '
                         f'c(#2f80d8) ashow({show},{SHOWN_TIME})')
            if index < SEGMENT_COUNT - 1:
                ring_x, ring_y = along_row(spin, x, y, segment_start + SEGMENT_LENGTH)
                lines.append(f'cyl r({spin},90,0) s(5.2,5.2,0.6) t({number(ring_x)},{number(ring_y)},-0.3) c(#2569b5) ashow({show},{SHOWN_TIME})')
    return lines


def translate(line):
    return [float(value) for value in re.search(r't\(([-\d.]+),([-\d.]+),([-\d.]+)\)', line).groups()]


def along_row(spin, x, y, offset):
    return (x, y + offset) if spin == 0 else (x + offset, y)


def number(value):
    return ('%.3f' % value).rstrip('0').rstrip('.')


if __name__ == '__main__':
    main()
