#!/usr/bin/env python3
"""
Generate bonsai-builds passive tree files from PoB's tree.json.

Reads:  PathOfBuilding-PoE2/src/TreeData/0_5/tree.json
Writes: public/poe2snippet.html  (SVG)
        public/data_us.json      (node metadata)
Prints: ascendancy data for passiveTreeLogic.ts
"""

import json
import math
import sys
import os
import re

# -------------------------------------------------------------------
# Configuration
# -------------------------------------------------------------------
TREE_JSON = os.path.join(os.path.dirname(__file__),
    '../../PathOfBuilding-PoE2/src/TreeData/0_5/tree.json')
OUT_SVG = os.path.join(os.path.dirname(__file__), '../public/poe2snippet.html')
OUT_JSON = os.path.join(os.path.dirname(__file__), '../public/data_us.json')

CIRCLE_RADII = {'normal': 100, 'notable': 140, 'keystone': 200}

# Scale factor for the main tree to open up the center for ascendancies.
# The largest ascendancy cluster radius is ~1891; the innermost main-tree
# node is ~1443 from center.  1.5× pushes that to ~2165, giving clearance.
MAIN_TREE_SCALE = 2.0


def load_tree():
    with open(TREE_JSON) as f:
        return json.load(f)


def compute_node_positions(tree):
    """Compute (x, y) for every node from group + orbit data.

    Main-tree nodes are scaled by MAIN_TREE_SCALE so the centre opens up
    for ascendancy clusters (which keep their original coordinates).
    """
    groups = tree['groups']          # list, 0-indexed; node.group is 1-indexed
    orbit_radii = tree['constants']['orbitRadii']
    orbit_angles = tree['constants']['orbitAnglesByOrbit']
    nodes = tree['nodes']
    positions = {}
    for nid, n in nodes.items():
        g_idx = n['group'] - 1       # groups list is 0-indexed
        g = groups[g_idx]
        orbit = n.get('orbit', 0)
        orbit_index = n.get('orbitIndex', 0)

        if orbit < len(orbit_angles) and orbit_index < len(orbit_angles[orbit]):
            angle = orbit_angles[orbit][orbit_index]
        else:
            angle = 0

        r = orbit_radii[orbit] if orbit < len(orbit_radii) else 0
        x = g['x'] + math.sin(angle) * r
        y = g['y'] - math.cos(angle) * r

        # Scale main-tree nodes outward; leave ascendancy nodes as-is
        if not n.get('ascendancyName'):
            x *= MAIN_TREE_SCALE
            y *= MAIN_TREE_SCALE

        positions[nid] = (round(x), round(y))
    return positions


def node_class(n):
    if n.get('isKeystone'):
        return 'keystone'
    if n.get('isNotable'):
        return 'notable'
    return 'normal'


def should_skip(n):
    """Skip mastery/root/decorative nodes."""
    if n.get('isMastery'):
        return True
    if not n.get('skill'):
        return True
    return False


def fmt(v):
    """Format a float for SVG (integer if close, else 2 decimals)."""
    if abs(v - round(v)) < 0.01:
        return str(int(round(v)))
    return f'{v:.2f}'


def build_svg(tree, positions):
    """Build SVG string."""
    nodes = tree['nodes']
    groups = tree['groups']
    orbit_radii = tree['constants']['orbitRadii']

    # Compute bounding box
    xs = [p[0] for p in positions.values()]
    ys = [p[1] for p in positions.values()]
    pad = 2000
    min_x, max_x = min(xs) - pad, max(xs) + pad
    min_y, max_y = min(ys) - pad, max(ys) + pad
    vb = f'{min_x} {min_y} {max_x - min_x} {max_y - min_y}'

    lines = []
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" id="passive_skill_tree" '
                 f'viewBox="{vb}" style="touch-action: none;">')
    lines.append('    <g id="connections" stroke="grey" stroke-width="16" fill="none">')

    # Track which connections we've already emitted (avoid duplicates)
    seen_conns = set()

    for nid, n in nodes.items():
        if should_skip(n):
            continue
        if nid not in positions:
            continue

        x1, y1 = positions[nid]
        g1_idx = n['group'] - 1
        g1 = groups[g1_idx]

        for conn in n.get('connections', []):
            tid = str(conn['id'])
            tn = nodes.get(tid)
            if tn is None or should_skip(tn) or tid not in positions:
                continue

            # Skip connections between ascendancy and non-ascendancy nodes
            # (these bridge the main tree and ascendancy sub-trees which get
            # repositioned by transforms in the app)
            n_is_asc = bool(n.get('ascendancyName'))
            t_is_asc = bool(tn.get('ascendancyName'))
            if n_is_asc != t_is_asc:
                continue
            # Skip connections between different ascendancies
            if n_is_asc and t_is_asc and n.get('ascendancyName') != tn.get('ascendancyName'):
                continue

            # Canonical connection key (lower id first)
            pair = tuple(sorted([nid, tid], key=int))
            if pair in seen_conns:
                continue
            seen_conns.add(pair)

            x2, y2 = positions[tid]
            conn_id = f'c{pair[0]}-{pair[1]}'
            conn_orbit = conn.get('orbit', 0)

            # Determine connection type
            same_group = (n['group'] == tn['group'])
            same_orbit = (n.get('orbit', 0) == tn.get('orbit', 0))

            # Scale factor for arcs: main-tree connections use scaled radii
            is_main = not n.get('ascendancyName')
            arc_scale = MAIN_TREE_SCALE if is_main else 1.0

            if same_group and same_orbit and n.get('orbit', 0) > 0 and conn_orbit == 0:
                # Same group, same orbit → arc centered at group center
                orbit = n['orbit']
                r = orbit_radii[orbit] if orbit < len(orbit_radii) else 0
                r *= arc_scale
                if r > 0:
                    # Determine sweep flag
                    cx, cy = g1['x'] * arc_scale, g1['y'] * arc_scale
                    a1 = math.atan2(x1 - cx, -(y1 - cy))
                    a2 = math.atan2(x2 - cx, -(y2 - cy))
                    # Normalize to [0, 2pi)
                    a1 = a1 % (2 * math.pi)
                    a2 = a2 % (2 * math.pi)
                    diff = (a2 - a1) % (2 * math.pi)
                    # Shorter arc: if diff > pi, go the other way
                    if diff <= math.pi:
                        sweep = 0  # counter-clockwise in SVG
                    else:
                        sweep = 1
                    large_arc = 0
                    lines.append(
                        f'<path d="M {fmt(x1)} {fmt(y1)} A {fmt(r)} {fmt(r)} 0 {large_arc} {sweep} '
                        f'{fmt(x2)} {fmt(y2)}" id="{conn_id}"></path>')
                else:
                    lines.append(f'<line x1="{fmt(x1)}" y1="{fmt(y1)}" '
                                 f'x2="{fmt(x2)}" y2="{fmt(y2)}" id="{conn_id}"></line>')

            elif conn_orbit != 0 and conn_orbit != 2147483647:
                # Arc connection with specified orbit
                orbit = abs(conn_orbit)
                r = orbit_radii[orbit] if orbit < len(orbit_radii) else 0
                r *= arc_scale
                if r <= 0:
                    lines.append(f'<line x1="{fmt(x1)}" y1="{fmt(y1)}" '
                                 f'x2="{fmt(x2)}" y2="{fmt(y2)}" id="{conn_id}"></line>')
                    continue

                dx = x2 - x1
                dy = y2 - y1
                dist = math.sqrt(dx * dx + dy * dy)

                if dist < r * 2 and dist > 0:
                    # Compute arc center using PoB's formula
                    sign = 1 if conn_orbit > 0 else -1
                    perp = math.sqrt(max(r * r - (dist * dist) / 4, 0)) * sign
                    arc_cx = x1 + dx / 2 + perp * (dy / dist)
                    arc_cy = y1 + dy / 2 - perp * (dx / dist)

                    # Determine sweep: check if center is on left or right of line
                    # Cross product to determine sweep direction
                    cross = dx * (arc_cy - y1) - dy * (arc_cx - x1)
                    sweep = 1 if cross > 0 else 0
                    large_arc = 0

                    lines.append(
                        f'<path d="M {fmt(x1)} {fmt(y1)} A {fmt(r)} {fmt(r)} 0 {large_arc} {sweep} '
                        f'{fmt(x2)} {fmt(y2)}" id="{conn_id}"></path>')
                else:
                    # Distance too large for arc, fall back to line
                    lines.append(f'<line x1="{fmt(x1)}" y1="{fmt(y1)}" '
                                 f'x2="{fmt(x2)}" y2="{fmt(y2)}" id="{conn_id}"></line>')
            else:
                # Straight line
                lines.append(f'<line x1="{fmt(x1)}" y1="{fmt(y1)}" '
                             f'x2="{fmt(x2)}" y2="{fmt(y2)}" id="{conn_id}"></line>')

    lines.append('    </g>')

    # Emit circles for each node
    for nid, n in nodes.items():
        if should_skip(n):
            continue
        if nid not in positions:
            continue
        x, y = positions[nid]
        cls = node_class(n)
        r = CIRCLE_RADII[cls]
        lines.append(f'<circle cx="{fmt(x)}" cy="{fmt(y)}" r="{r}" '
                     f'class="{cls}" id="n{n["skill"]}"></circle>')

    lines.append('</svg>')
    return '\n'.join(lines)


def convert_icon_path(dds_path):
    """Convert PoB .dds icon path to .webp format the app expects."""
    # Art/2DArt/SkillIcons/passives/LightningDamagenode.dds → passives/LightningDamagenode.webp
    m = re.search(r'passives/(.+)\.dds$', dds_path, re.IGNORECASE)
    if m:
        return f'passives/{m.group(1)}.webp'
    # Fallback: extract just the filename
    m = re.search(r'SkillIcons/([^/]+)\.dds$', dds_path, re.IGNORECASE)
    if m:
        return f'SkillIcons/{m.group(1)}.webp'
    return None


def build_data_json(tree):
    """Build data_us.json matching the format passiveTreeLogic.ts expects."""
    nodes_out = {}
    for nid, n in tree['nodes'].items():
        if should_skip(n):
            continue
        skill_id = str(n['skill'])
        entry = {
            'name': n.get('name', ''),
            'stats': n.get('stats', []),
        }
        icon = convert_icon_path(n.get('icon', ''))
        if icon:
            entry['icon'] = icon
        if n.get('isKeystone'):
            entry['isKeystone'] = True
        if n.get('isNotable'):
            entry['isNotable'] = True
        if n.get('ascendancyName'):
            entry['ascendancyName'] = n['ascendancyName']
        nodes_out[skill_id] = entry

    return {'nodes': nodes_out}


def resolve_replace_ascendancies(classes, asc_nodes, asc_starts, asc_transforms):
    """Propagate data from replaced ascendancies to their replacements.

    In 0.5 'Abyssal Lich' replaces 'Lich': they share the same nodes,
    start node, and transform.  The replacement ascendancy has no nodes
    of its own in tree.json, so we copy from the source.
    """
    for cls in classes:
        for asc in cls.get('ascendancies', []):
            replace = asc.get('replace')
            if not replace:
                continue
            name = asc['name']
            if name in asc_nodes:
                continue  # already has its own nodes
            if replace not in asc_nodes:
                continue
            asc_nodes[name] = asc_nodes[replace]
            if replace in asc_starts:
                asc_starts[name] = asc_starts[replace]
            if replace in asc_transforms:
                asc_transforms[name] = asc_transforms[replace]


def print_ascendancy_data(tree, positions):
    """Print ascendancy data for manual insertion into ascendancyConfig.ts."""
    nodes = tree['nodes']
    classes = tree['classes']

    # Gather ascendancy nodes
    asc_nodes = {}  # ascName -> list of skill IDs
    asc_starts = {}  # ascName -> start node skill ID
    for nid, n in nodes.items():
        asc = n.get('ascendancyName')
        if not asc:
            continue
        if should_skip(n):
            continue
        asc_nodes.setdefault(asc, []).append(str(n['skill']))
        if n.get('isAscendancyStart'):
            asc_starts[asc] = str(n['skill'])

    # Compute transforms: negate cluster mean so ascendancies render at (0,0).
    asc_transforms = {}
    for asc_name, skill_ids in asc_nodes.items():
        xs = [positions[s][0] for s in skill_ids if s in positions]
        ys = [positions[s][1] for s in skill_ids if s in positions]
        if xs:
            asc_transforms[asc_name] = (-sum(xs) / len(xs), -sum(ys) / len(ys))

    # Propagate data for replacement ascendancies (e.g. Abyssal Lich ← Lich)
    resolve_replace_ascendancies(classes, asc_nodes, asc_starts, asc_transforms)

    print('\n' + '=' * 80)
    print('ASCENDANCY DATA FOR ascendancyConfig.ts')
    print('=' * 80)

    print('\nexport const ascendancyData = {')
    for cls in classes:
        for asc in cls.get('ascendancies', []):
            name = asc['name']
            if name not in asc_nodes:
                continue
            node_list = sorted(asc_nodes[name], key=int)
            tx, ty = asc_transforms.get(name, (0, 0))
            nodes_str = ', '.join(f'"{n}"' for n in node_list)
            print(f'    "{name}": {{ nodes: [{nodes_str}], '
                  f'transform: "translate({tx:.2f}, {ty:.2f})" }},')
    print('};')

    print('\nexport const classAscendancies = {')
    for cls in classes:
        asc_list = []
        for asc in cls.get('ascendancies', []):
            name = asc['name']
            if name in asc_nodes:
                asc_list.append(f'"{name}"')
        if asc_list:
            print(f'    "{cls["name"]}": [{", ".join(asc_list)}],')
    print('};')

    print('\nexport const ascendancyNames = {')
    for cls in classes:
        for asc in cls.get('ascendancies', []):
            name = asc['name']
            if name in asc_nodes:
                print(f'    "{name}": "{name}",')
    print('};')

    print('\nexport const ascendancyStartNodes = {')
    for cls in classes:
        for asc in cls.get('ascendancies', []):
            name = asc['name']
            if name in asc_starts:
                print(f'    "{name}": "{asc_starts[name]}",')
    print('};')


def main():
    print('Loading tree.json...')
    tree = load_tree()
    print(f'  Nodes: {len(tree["nodes"])}, Groups: {len(tree["groups"])}')

    print('Computing node positions...')
    positions = compute_node_positions(tree)
    print(f'  Computed positions for {len(positions)} nodes')

    print('Building SVG...')
    svg = build_svg(tree, positions)
    with open(OUT_SVG, 'w') as f:
        f.write(svg)
    print(f'  Wrote {OUT_SVG} ({len(svg)} bytes)')

    print('Building data_us.json...')
    data = build_data_json(tree)
    with open(OUT_JSON, 'w') as f:
        json.dump(data, f, separators=(',', ':'))
    print(f'  Wrote {OUT_JSON} ({len(data["nodes"])} nodes)')

    print_ascendancy_data(tree, positions)


if __name__ == '__main__':
    main()
