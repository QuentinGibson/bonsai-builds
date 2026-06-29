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

describe('ScreenPassiveTree sprite icon CSS', () => {
  it('.node-icon-active is hidden by default', () => {
    expect(scss).toMatch(/\.node-icon-active\s*\{[^}]*display:\s*none/s);
  });

  it('circle.allocated + .node-icon-active is shown', () => {
    expect(scss).toMatch(/circle\.allocated\s*\+\s*\.node-icon-active\s*\{[^}]*display:\s*inline/s);
  });

  it('circle.allocated + .node-icon-active + .node-icon-disabled is hidden', () => {
    expect(scss).toMatch(/circle\.allocated\s*\+\s*\.node-icon-active\s*\+\s*\.node-icon-disabled\s*\{[^}]*display:\s*none/s);
  });

  it('.node-icon-active default-hide rule appears before the allocated-show rule', () => {
    const hidePos = scss.indexOf('.node-icon-active');
    const showPos = scss.indexOf('circle.allocated + .node-icon-active');
    expect(hidePos).toBeGreaterThan(-1);
    expect(showPos).toBeGreaterThan(-1);
    expect(hidePos).toBeLessThan(showPos);
  });
});
