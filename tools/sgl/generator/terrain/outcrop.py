# Building blocks for generating grassy rocky outcrops in SGL (Sektor Graphics Language):
# pri5 rocks, sph trees, and the geometry needed to place trees on the ground or on rock roofs.
# The geometry mirrors shared/applyCommands.ts and shared/primitive/*.
import math
import random

ROCK_PALETTE = ['abc3a7', 'a4aea3', 'a5b3a2', '8fac8b', 'acb89d', 'b0bea2', 'b6ccb3', 'd2d7bc']
TREE_COLOR_LOW = (0x00, 0x69, 0x03)
TREE_COLOR_HIGH = (0x63, 0xff, 0x69)


def random_rock(tall):
    if tall:
        distance = random.uniform(0, 18)
        height = random.randint(18, 23)
        position_z = random.choice([-5, -5, 0])
    else:
        distance = random.uniform(22, 35)
        height = 10
        position_z = 0
    angle = random.uniform(0, 2 * math.pi)
    position_x = max(-25, min(25, round(distance * math.cos(angle))))
    position_y = max(-25, min(25, round(distance * math.sin(angle))))
    return ([random.randint(26, 45), random.randint(26, 47), height],
            [position_x, position_y, position_z],
            [random.randint(-20, 140), random.randint(-8, 11), random.choice([-5, 0, 0])],
            rock_color())


def rock_color():
    first, second = random.sample(ROCK_PALETTE, 2)
    return blend(bytes.fromhex(first), bytes.fromhex(second), random.random())


def random_tree_color():
    return blend(TREE_COLOR_LOW, TREE_COLOR_HIGH, random.random())


def blend(low, high, mix):
    return ''.join('%02x' % round(low_channel + (high_channel - low_channel) * mix)
                   for low_channel, high_channel in zip(low, high))


def tree_size():
    while True:
        width = random.randint(4, 8)
        roll = random.random()
        extra = 0 if roll < 0.2 else (1 if roll < 0.6 else 2)
        height = min(9, max(5, width + extra))
        if height >= width:
            return width, height


def rock_line(rock):
    scale, position, rotation, color = rock
    return (f"pri5 s({scale[0]},{scale[1]},{scale[2]}) t({position[0]},{position[1]},{position[2]}) "
            f"r({rotation[0]},{rotation[1]},{rotation[2]}) c(#{color})")


def top_of(rock):
    return max(corner[2] for corner in rock_geometry(*rock[:3])[0])


def roof_under(rocks_geometry, x, y, radius):
    # Height of the roof a tree of this radius can stand on at (x, y), or None when there is no
    # single roof under its whole footprint, or a taller neighbouring rock covers it.
    samples = circle(x, y, radius)
    for index, (top, bottom, rock_hull) in enumerate(rocks_geometry):
        if not all(inside(top, sample_x, sample_y) for sample_x, sample_y in samples):
            continue
        blocked = any(inside(other[2], sample_x, sample_y)
                      and max(corner[2] for corner in other[0] + other[1]) > roof_height(top, sample_x, sample_y) - 0.5
                      for other_index, other in enumerate(rocks_geometry) if other_index != index
                      for sample_x, sample_y in samples)
        if not blocked:
            return roof_height(top, x, y)
    return None


def circle(x, y, radius):
    return [(x, y)] + [(x + radius * math.cos(step * math.pi / 4), y + radius * math.sin(step * math.pi / 4))
                       for step in range(8)]


def roof_height(top, x, y):
    first, second, third = top[0], top[1], top[2]
    u_x, u_y, u_z = [second[axis] - first[axis] for axis in range(3)]
    v_x, v_y, v_z = [third[axis] - first[axis] for axis in range(3)]
    normal_x, normal_y, normal_z = u_y * v_z - u_z * v_y, u_z * v_x - u_x * v_z, u_x * v_y - u_y * v_x
    return first[2] - (normal_x * (x - first[0]) + normal_y * (y - first[1])) / normal_z


def rock_geometry(scale, position, rotation):
    # Returns the rock's top face corners, bottom face corners (x, y, height) and its ground-plane outline.
    angles = [-math.pi / 2 + math.pi / 4 + 2 * math.pi * index / 5 for index in range(5)]
    top = [world((50 * math.cos(angle), -107.5, 50 * math.sin(angle)), scale, position, rotation) for angle in angles]
    bottom = [world((50 * math.cos(angle), -7.5, 50 * math.sin(angle)), scale, position, rotation) for angle in angles]
    return top, bottom, hull(top + bottom)


def world(vertex, scale, position, rotation):
    x, y, z = vertex[0] * scale[0] / 100, vertex[1] * scale[2] / 100, vertex[2] * scale[1] / 100
    spin, tilt_x, tilt_y = [degrees * math.pi / 180 for degrees in rotation]
    x, y = x * math.cos(tilt_y) - y * math.sin(tilt_y), x * math.sin(tilt_y) + y * math.cos(tilt_y)
    y, z = y * math.cos(tilt_x) - z * math.sin(tilt_x), y * math.sin(tilt_x) + z * math.cos(tilt_x)
    x, z = x * math.cos(spin) + z * math.sin(spin), -x * math.sin(spin) + z * math.cos(spin)
    return x + position[0], z + position[1], -y + position[2]


def hull(points):
    points = sorted(set((point[0], point[1]) for point in points))

    def half(sorted_points):
        chain = []
        for point in sorted_points:
            while len(chain) >= 2 and ((chain[-1][0] - chain[-2][0]) * (point[1] - chain[-2][1])
                                       - (chain[-1][1] - chain[-2][1]) * (point[0] - chain[-2][0])) <= 0:
                chain.pop()
            chain.append(point)
        return chain

    return half(points)[:-1] + half(points[::-1])[:-1]


def inside(polygon, x, y):
    sign = 0
    for index in range(len(polygon)):
        start_x, start_y = polygon[index][:2]
        end_x, end_y = polygon[(index + 1) % len(polygon)][:2]
        cross = (end_x - start_x) * (y - start_y) - (end_y - start_y) * (x - start_x)
        if cross != 0:
            if sign == 0:
                sign = 1 if cross > 0 else -1
            elif (cross > 0) != (sign > 0):
                return False
    return True
