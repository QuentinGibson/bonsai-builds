import { PASSIVE_ICON_FRAMES } from "../data/passiveIconFrames";
import { PASSIVE_ICON_FRAMES_DISABLED } from "../data/passiveIconFramesDisabled";

export type SpriteFrame = { x: number; y: number; w: number; h: number };

/** Sprite sheet dimensions (both sheets are the same size). */
export const SPRITE_SHEET_W = 1029;
export const SPRITE_SHEET_H = 1508;

/**
 * Returns the frame coordinates for an icon in the active sprite sheet (skills.webp),
 * or null if the icon is not in the sprite (e.g. mastery icons with individual PNGs).
 *
 * @param iconName - lowercased icon path after "passives/", without extension.
 *   e.g. "archonofundeathnode" or "gemling/gemlingbarrier"
 */
export function getActiveFrame(iconName: string): SpriteFrame | null {
	const entry = PASSIVE_ICON_FRAMES[iconName];
	if (!entry) return null;
	return { x: entry[0], y: entry[1], w: entry[2], h: entry[3] };
}

/**
 * Returns the frame coordinates for an icon in the disabled sprite sheet (skills-disabled.webp),
 * or null if the icon is not in the sprite.
 */
export function getDisabledFrame(iconName: string): SpriteFrame | null {
	const entry = PASSIVE_ICON_FRAMES_DISABLED[iconName];
	if (!entry) return null;
	return { x: entry[0], y: entry[1], w: entry[2], h: entry[3] };
}

/**
 * Computes the SVG image attributes needed to display `frame` centered at (cx, cy)
 * with the icon rendered at `imgSize` pixels. The returned x/y/width/height position
 * the full sprite sheet so that the frame region falls inside the clip circle.
 */
export function computeSpriteAttrs(
	cx: number,
	cy: number,
	imgSize: number,
	frame: SpriteFrame,
): { x: number; y: number; width: number; height: number } {
	const s = imgSize / frame.w;
	return {
		x: (cx - imgSize / 2) - frame.x * s,
		y: (cy - imgSize / 2) - frame.y * s,
		width: SPRITE_SHEET_W * s,
		height: SPRITE_SHEET_H * s,
	};
}
