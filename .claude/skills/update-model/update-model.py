#!/usr/bin/env python3
"""Regenerate model.md (mermaid graph of buildings and resources) from buildings.md."""
import re
import subprocess
from pathlib import Path

repository_root = Path(subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip())
buildings_file = repository_root / 'frontend/src/assets/buildings.md'
model_file = repository_root / 'model.md'


def main():
    buildings = parse_buildings(buildings_file.read_text())
    model_file.write_text(render_model(buildings))
    resource_count = len({resource for building in buildings for resource in building['inputs'] + building['outputs']})
    print(f'{model_file}: {len(buildings)} buildings, {resource_count} resources')


def parse_buildings(text):
    buildings = []
    current_building = None
    current_section = None
    current_side = None
    for line in text.splitlines():
        line = line.strip()
        if line.startswith('# '):
            current_building = {'name': line[2:].strip(), 'inputs': [], 'outputs': []}
            buildings.append(current_building)
            current_section = None
        elif line.startswith('## '):
            current_section = line[3:].strip()
            current_side = 'inputs'
        elif current_section == 'Function' and current_building:
            if line.startswith('->'):
                current_side = 'outputs'
            elif re.match(r'^[A-Z]\w*(\s|$)', line) and ':' not in line:
                resource = line.split()[0]
                resources = current_building[current_side]
                if resource not in resources:
                    resources.append(resource)
    return [building for building in buildings if building['inputs'] or building['outputs']]


def render_model(buildings):
    resources = sorted({resource for building in buildings for resource in building['inputs'] + building['outputs']})
    lines = ['```mermaid', 'graph LR']
    for building in buildings:
        lines.append(f'    B_{node_id(building["name"])}["{building["name"]}"]')
    for resource in resources:
        lines.append(f'    R_{node_id(resource)}("{resource}")')
    lines.append('')
    for building in buildings:
        for resource in building['inputs']:
            lines.append(f'    R_{node_id(resource)} --> B_{node_id(building["name"])}')
        for resource in building['outputs']:
            lines.append(f'    B_{node_id(building["name"])} --> R_{node_id(resource)}')
    lines.append('```')
    header = ('# Model\n\nBuildings (rectangles) and resources (rounded rectangles), '
              'generated from `frontend/src/assets/buildings.md`.\n\n')
    return header + '\n'.join(lines) + '\n'


def node_id(name):
    return re.sub(r'\W', '', name)


if __name__ == '__main__':
    main()
