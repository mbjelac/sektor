"""Writes Composter variants 1-9 (<n>.sgl) into frontend/src/assets/buildings/Composter/.
Variant 0 is left alone.

The tile is a 3x3 grid of cells, like Agriplot's crop sections. Per variant:
- one random cell holds the silo: Fertilizatron's small one, with a green band under the dome
  and a green triangle panel facing east, as on Fertilizatron;
- each other cell is a section of 6 rows 30 long and 5 apart, running north-south or east-west
  at random;
- 3 random sections are blue pipes 4.6 across, ringed every 5 by wider, thin segment rings;
- the other 5 are rows 4 across, each dark brown or dark gray at random, with a yellow box on it,
  shifted 1.2 to a random side of the row and standing on the floor, gliding from one end of the
  row to the other in 16 s, waiting 3 s, and back. It stops 2.5 short of each end, so some of the
  row still shows past it. Each box starts at a random point of its trip: its at() start is
  negative, which runs the glide that far ahead.

Rows are half sunk: their axis lies at z 0. Seeded by the variant number; rerunning reproduces
the files.
"""
import os
import random

OUTPUT_DIRECTORY = os.path.join(os.path.dirname(__file__), '../../../../frontend/src/assets/buildings/Composter')
VARIANTS = range(1, 10)

CELL_CENTRES = (-31.5, 0, 31.5)
ROW_COUNT = 6
ROW_PITCH = 5
ROW_LENGTH = 30
BLUE_SECTIONS = 3

SOIL_DIAMETER = 4
SOIL_COLORS = ['#4a2f1b', '#3d3d3d']
BOX_COLOR = '#f2b705'
BOX_SIZE = 4
BOX_HEIGHT = 2.5
BOX_BASE = 0
BOX_SIDE_OFFSET = 1.2
BOX_END_CLEARANCE = 2.5  # row left showing past the box at either end of its trip
BOX_HALF_WIDTH = 0.707 * BOX_SIZE / 2
BOX_REACH = ROW_LENGTH / 2 - BOX_END_CLEARANCE - BOX_HALF_WIDTH
BOX_TRIP = 16000
BOX_PAUSE = 3000
BOX_CYCLE = 2 * (BOX_TRIP + BOX_PAUSE)
ANIMATION_STEP = 20

PIPE_DIAMETER = 4.6
PIPE_COLOR = '#2f80d8'
RING_DIAMETER = 5.2
RING_LENGTH = 0.6
RING_STEP = 5
RING_COLOR = '#2569b5'


def main():
    for variant in VARIANTS:
        generator = random.Random(variant)
        cells = [(x, y) for y in CELL_CENTRES for x in CELL_CENTRES]
        silo_cell = generator.choice(cells)
        section_cells = [cell for cell in cells if cell != silo_cell]
        blue_cells = set(generator.sample(section_cells, BLUE_SECTIONS))
        sections = [silo_lines(*silo_cell)]
        for cell in section_cells:
            spin = generator.choice([0, 90])
            rows = section_rows(spin, *cell)
            sections.append(pipe_section_lines(rows) if cell in blue_cells else soil_section_lines(rows, generator))
        write(f'{variant}.sgl', sections)
        print(f'{variant}: silo at {silo_cell}, blue sections at {sorted(blue_cells)}')


def silo_lines(x, y):
    return [
        f'cyl s(10,10,20) t({number(x)},{number(y)},0) c(#ffffff)',
        f'sph s(10,10,10) t({number(x)},{number(y)},15.25) c(#ffffff)',
        f'cyl s(11,11,3) t({number(x)},{number(y)},16.9) c(#0dc200)',
        f'cyl s(12,12,2) t({number(x)},{number(y)},-0.35) c(#c0c0c0)',
        f'pri3 s(5,5,1) t({number(x + 4.575)},{number(y)},12.5) r(0,45,90) c(#0dc200)',
    ]


# Each row is (spin, x, y): spin 0 lies along y (north-south), spin 90 along x; (x, y) is its middle.
def section_rows(spin, x, y):
    offsets = [(index - (ROW_COUNT - 1) / 2) * ROW_PITCH for index in range(ROW_COUNT)]
    return [(spin, x + offset, y) if spin == 0 else (spin, x, y + offset) for offset in offsets]


def pipe_section_lines(rows):
    lines = []
    for spin, x, y in rows:
        lines.append(row_line(spin, x, y, PIPE_DIAMETER, ROW_LENGTH, PIPE_COLOR))
        first_ring = -int((ROW_LENGTH / 2 - 1) // RING_STEP) * RING_STEP
        for ring in range(first_ring, -first_ring + 1, RING_STEP):
            ring_x, ring_y = along_row(spin, x, y, ring, 0)
            lines.append(row_line(spin, ring_x, ring_y, RING_DIAMETER, RING_LENGTH, RING_COLOR))
    return lines


def soil_section_lines(rows, generator):
    lines = []
    for spin, x, y in rows:
        lines.append(row_line(spin, x, y, SOIL_DIAMETER, ROW_LENGTH, generator.choice(SOIL_COLORS)))
        lead = round(generator.uniform(0, BOX_CYCLE) / ANIMATION_STEP) * ANIMATION_STEP
        lines.append(box_line(spin, x, y, generator.choice([-1, 1]) * BOX_SIDE_OFFSET, lead))
    return lines


# The box stands at the row's west or south end of its trip and glides to the other end and back;
# lead is how far into that BOX_CYCLE it is when the building appears.
def box_line(spin, x, y, side, lead):
    box_x, box_y = along_row(spin, x, y, -BOX_REACH, side)
    glide_x, glide_y = along_row(spin, 0, 0, 2 * BOX_REACH, 0)
    return (f'pri4 s({BOX_SIZE},{BOX_SIZE},{BOX_HEIGHT}) t({number(box_x)},{number(box_y)},{BOX_BASE}) c({BOX_COLOR}) '
            f'at({number(glide_x)},{number(glide_y)},0,{BOX_TRIP},{BOX_PAUSE},{-lead})')


def row_line(spin, x, y, diameter, length, color):
    return f'cyl r({spin},90,0) s({diameter},{diameter},{length}) t({number(x)},{number(y)},{number(-length / 2)}) c({color})'


def along_row(spin, x, y, offset, side):
    return (x + side, y + offset) if spin == 0 else (x + offset, y + side)


def number(value):
    return ('%.3f' % value).rstrip('0').rstrip('.')


def write(name, sections):
    with open(os.path.join(OUTPUT_DIRECTORY, name), 'w') as file:
        file.write('\n\n'.join('\n'.join(section) for section in sections) + '\n')


if __name__ == '__main__':
    main()
