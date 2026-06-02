#!/usr/bin/env python3
"""
Generate bonsai-builds item and mod JSON files from PoB's data.

Reads:  PathOfBuilding-PoE2/src/Data/Bases/  (item base Lua files)
        PathOfBuilding-PoE2/src/Data/Mods.lua (mod list)
Writes: public/items.json  Array<{id, name, inventory_id}>
        public/mods.json   Array<{id, name}>

inventory_id values match PoB's slot names:
  Weapon, Weapon2, Helm, BodyArmour, Gloves, Boots,
  Ring, Ring2, Amulet, Belt, Flask1–Flask5
"""

import json
import os
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
POB_ROOT = os.path.join(SCRIPT_DIR, '../../PathOfBuilding-PoE2')
BASES_DIR = os.path.join(POB_ROOT, 'src/Data/Bases')
MODS_LUA  = os.path.join(POB_ROOT, 'src/Data/Mods.lua')

OUT_ITEMS = os.path.join(SCRIPT_DIR, '../public/items.json')
OUT_MODS  = os.path.join(SCRIPT_DIR, '../public/mods.json')

# PoB itemClass → bonsai inventory_id
ITEM_CLASS_MAP = {
    'One Handed Sword':   'Weapon',
    'Two Handed Sword':   'Weapon',
    'One Handed Axe':     'Weapon',
    'Two Handed Axe':     'Weapon',
    'One Handed Mace':    'Weapon',
    'Two Handed Mace':    'Weapon',
    'Spear':              'Weapon',
    'Flail':              'Weapon',
    'Wand':               'Weapon',
    'Bow':                'Weapon',
    'Crossbow':           'Weapon',
    'Quarterstaff':       'Weapon',
    'Staff':              'Weapon',
    'Dagger':             'Weapon',
    'Claw':               'Weapon',
    'Shield':             'Weapon2',
    'Buckler':            'Weapon2',
    'Quiver':             'Weapon2',
    'Focus':              'Weapon2',
    'Helm':               'Helm',
    'BodyArmour':         'BodyArmour',
    'Gloves':             'Gloves',
    'Boots':              'Boots',
    'Ring':               'Ring',   # applied to both Ring and Ring2
    'Amulet':             'Amulet',
    'Belt':               'Belt',
    'LifeFlask':          None,      # handled separately per slot
    'ManaFlask':          None,
    'UtilityFlask':       None,
    'HybridFlask':        None,
}

FLASK_CLASSES = {'LifeFlask', 'ManaFlask', 'UtilityFlask', 'HybridFlask', 'Flask'}


def parse_base_lua(path):
    """Parse a PoB item base Lua file and return list of (id, name, item_class)."""
    results = []
    text = open(path, encoding='utf-8', errors='ignore').read()

    # PoB base files typically have entries like:
    # ["RustedSword"] = { name = "Rusted Sword", type = "One Handed Sword", ... }
    # or: { id = "RustedSword", name = "Rusted Sword", ... }
    # Format varies by version — we try both patterns.

    # Pattern 1: ["id"] = { name = "Name", type = "ItemClass", ... }
    for m in re.finditer(
        r'\["([^"]+)"\]\s*=\s*\{[^}]*\bname\s*=\s*"([^"]+)"[^}]*\btype\s*=\s*"([^"]+)"',
        text,
        re.DOTALL,
    ):
        results.append((m.group(1), m.group(2), m.group(3)))

    # Pattern 2: { id = "id", name = "Name", type = "ItemClass", ... }
    if not results:
        for m in re.finditer(
            r'\{\s*id\s*=\s*"([^"]+)"[^}]*\bname\s*=\s*"([^"]+)"[^}]*\btype\s*=\s*"([^"]+)"',
            text,
            re.DOTALL,
        ):
            results.append((m.group(1), m.group(2), m.group(3)))

    return results


def build_items():
    if not os.path.isdir(BASES_DIR):
        print(f'ERROR: Bases directory not found: {BASES_DIR}')
        print('Clone PathOfBuilding-PoE2 next to bonsai-builds and re-run.')
        return None

    items = []
    seen = set()

    for fname in sorted(os.listdir(BASES_DIR)):
        if not fname.endswith('.lua'):
            continue
        path = os.path.join(BASES_DIR, fname)
        for item_id, name, item_class in parse_base_lua(path):
            if item_id in seen:
                continue
            seen.add(item_id)

            if item_class in FLASK_CLASSES:
                # Flasks appear in all 5 flask slots
                for slot_n in range(1, 6):
                    items.append({
                        'id': f'{item_id}_slot{slot_n}',
                        'name': name,
                        'inventory_id': f'Flask{slot_n}',
                    })
            else:
                inv_id = ITEM_CLASS_MAP.get(item_class)
                if inv_id is None:
                    continue
                items.append({'id': item_id, 'name': name, 'inventory_id': inv_id})
                # Rings appear in both ring slots
                if inv_id == 'Ring':
                    items.append({'id': f'{item_id}_ring2', 'name': name, 'inventory_id': 'Ring2'})

    return items


def build_mods():
    if not os.path.isfile(MODS_LUA):
        print(f'ERROR: Mods.lua not found: {MODS_LUA}')
        print('Clone PathOfBuilding-PoE2 next to bonsai-builds and re-run.')
        return None

    mods = []
    seen = set()
    text = open(MODS_LUA, encoding='utf-8', errors='ignore').read()

    # PoB Mods.lua format: ["ModId"] = { ..., name = "mod display text", ... }
    for m in re.finditer(
        r'\["([^"]+)"\]\s*=\s*\{[^}]*\bname\s*=\s*"([^"]+)"',
        text,
        re.DOTALL,
    ):
        mod_id, name = m.group(1), m.group(2)
        if mod_id in seen:
            continue
        seen.add(mod_id)
        mods.append({'id': mod_id, 'name': name})

    return mods


def main():
    items = build_items()
    if items is not None:
        with open(OUT_ITEMS, 'w') as f:
            json.dump(items, f, indent=2)
        print(f'Wrote {OUT_ITEMS} ({len(items)} items)')

    mods = build_mods()
    if mods is not None:
        with open(OUT_MODS, 'w') as f:
            json.dump(mods, f, indent=2)
        print(f'Wrote {OUT_MODS} ({len(mods)} mods)')


if __name__ == '__main__':
    main()
