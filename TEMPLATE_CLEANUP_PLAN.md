# BonsaiBuild Template Cleanup Plan

## Overview
This Overwolf application was built as a UI/UX example with League of Legends demo logic. This plan outlines the steps to convert it into a clean Path of Exile 2 skill tree builder template.

## Quick Action Plan

### Step 1: Update Game Configuration for PoE2
**Priority:** High
**Files to modify:**
- `manifest.json` - Update game ID from placeholder to PoE2
- `src/config/constants.ts` - Remove LoL constants, add PoE2 specifics

**Changes:**
- Replace game ID 5426 (LoL) with Path of Exile 2's game ID
- Update Discord URL to BonsaiBuild's Discord
- Remove LoL-specific game features
- Update window dimensions if needed

---

### Step 2: Remove Demo Screens
**Priority:** Medium
**Files to delete:**
- `src/components/ScreenA/` - Statistics/charts demo
- `src/components/ScreenB/` - Video replay demo
- `src/components/Sample/` - Generic sample component
- `src/components/ScreenMain/` - Placeholder main screen (if not needed)

**Files to update:**
- `src/config/enums.ts` - Remove screen A and B from enum
- `src/components/Navigation/Navigation.tsx` - Clean up commented demo tabs
- Remove related images: `nav-a.svg`, `nav-b.svg`, chart/stats images

---

### Step 3: Clean Up Background Logic
**Priority:** High
**Files to modify:**
- `src/background.ts` - Remove LoL-specific event handlers

**Changes:**
- Remove LoL game launch detection (lines 264-269)
- Remove match start/end event handlers (lines 287-332)
- Remove LoL game launch notifications (lines 376-407)
- Update or remove LoL-specific game event registration
- Keep core Overwolf infrastructure (window management, event bus, etc.)

---

### Step 4: Rewrite FTUE (First Time User Experience)
**Priority:** Medium
**Files to modify:**
- `src/components/FTUE/FTUE.tsx`

**Changes:**
- Replace generic Overwolf tutorial with PoE2 skill tree onboarding
- Update FTUE background images
- Create new tutorial steps specific to BonsaiBuild features
- Explain skill tree navigation, build saving, etc.

---

## Additional Cleanup (Optional)

### Step 5: Clean Up Store/State Management
**Files to modify:**
- `src/store/common.ts` - Remove LoL match state
- `src/store/pers.ts` - Remove LoL match event preferences

### Step 6: Remove Unused Demo Assets
**Files to delete:**
- `src/images/pie.svg`
- `src/images/chart.svg`
- `src/images/avatar.svg`
- `src/images/event-*.svg` (LoL event icons)
- `src/images/video-player.svg`
- `src/images/player-*.svg`
- `src/images/ftue-*-bg.png` and `ftue-*-bg.jpg` (replace with PoE2-themed)

### Step 7: Update Premium/Monetization (If Needed)
**Files to modify:**
- `src/components/Premium/Premium.tsx` - Update subscription plans
- `src/components/AdPremium/AdPremium.tsx` - Implement or remove

---

## What to Keep

### Core Infrastructure (DO NOT REMOVE)
- Overwolf window management system
- Event bus communication pattern
- State management (common + persistent stores)
- Hotkey handling framework
- Background controller architecture
- Loading screen and notice system
- Error boundary and error handling
- Context providers and hooks system
- CSS/SCSS architecture

### Reusable UI Components
- Switch/Checkbox/Radio components
- Dropdown component
- Tooltip/Tip components
- HotkeyEditor component
- Popup system
- Toaster/Toast system
- Settings component structure
- Feedback/BugReport forms

### PoE2-Specific Work (Already Implemented)
- `src/components/ScreenPassiveTree/` - Main skill tree screen
- `src/components/ScreenPassiveTree/passiveTreeLogic.ts` - Tree logic
- `public/data_us.json` - PoE2 tree data
- Bonsai branding assets

---

## Progress Tracking

- [ ] Step 1: Update game configuration
- [ ] Step 2: Remove demo screens
- [ ] Step 3: Clean up background logic
- [ ] Step 4: Rewrite FTUE
- [ ] Step 5: Clean up store/state (optional)
- [ ] Step 6: Remove unused demo assets (optional)
- [ ] Step 7: Update monetization (optional)

---

## Notes

- Work through each step sequentially to verify results
- Test the app after each major change
- Keep commits small and focused on one step at a time
- Preserve all core Overwolf infrastructure - only remove demo/LoL logic
