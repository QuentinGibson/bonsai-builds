import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const scss = readFileSync(join(__dirname, 'ScreenPassiveTree.scss'), 'utf8');

describe('ScreenPassiveTree tooltip font sizes', () => {
  it('.tooltip-title renders at ~18px', () => {
    const titleBlock = scss.slice(scss.indexOf('.tooltip-title'), scss.indexOf('.tooltip-stats'));
    expect(titleBlock).toMatch(/font-size:\s*18px/);
  });

  it('.tooltip-stats div renders at ~14px', () => {
    const statsBlock = scss.slice(scss.indexOf('.tooltip-stats'), scss.indexOf('#node-tooltip', scss.indexOf('.tooltip-stats')));
    expect(statsBlock).toMatch(/div\s*\{[^}]*font-size:\s*14px/s);
  });
});
