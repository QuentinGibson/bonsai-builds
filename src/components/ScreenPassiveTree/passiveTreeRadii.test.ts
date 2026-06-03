import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const svg = readFileSync(join(__dirname, '../../../public/poe2snippet.html'), 'utf8');

describe('passive tree node radii', () => {
  it('normal nodes have r=100', () => {
    expect(svg).toMatch(/class="normal"[^>]*r="100"|r="100"[^>]*class="normal"/);
  });

  it('notable nodes have r=140', () => {
    expect(svg).toMatch(/class="notable"[^>]*r="140"|r="140"[^>]*class="notable"/);
  });

  it('keystone nodes have r=200', () => {
    expect(svg).toMatch(/class="keystone"[^>]*r="200"|r="200"[^>]*class="keystone"/);
  });

  it('no nodes use old radii (40, 56, 104)', () => {
    const normals   = [...svg.matchAll(/r="(\d+)"[^>]*class="normal"/g)].map(m => m[1]);
    const notables  = [...svg.matchAll(/r="(\d+)"[^>]*class="notable"/g)].map(m => m[1]);
    const keystones = [...svg.matchAll(/r="(\d+)"[^>]*class="keystone"/g)].map(m => m[1]);
    expect(normals.length).toBeGreaterThan(0);
    expect(normals.every(r => r !== '40')).toBe(true);
    expect(notables.every(r => r !== '56')).toBe(true);
    expect(keystones.every(r => r !== '104')).toBe(true);
  });
});
