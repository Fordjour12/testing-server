# UI Updates for Hybrid Plan Generation

## Overview

We have transformed the plan generation interface to support the new hybrid architecture while adhering to the **"Intentional Minimalism"** and **"Avant-Garde"** design philosophies.

## New Premium Components

### 1. Draft Recovery Banner (`DraftRecoveryBanner`)

**Philosophy**: Non-intrusive yet impossible to miss.

- **Visuals**: Glassmorphism effect with a subtle gradient overlay.
- **Interaction**: Smooth entrance animation using `motion`.
- **Function**: Allows users to instantly resume their work or discard it.
- **Why**: Protects user intent without blocking their flow.

### 2. Auto-Save Indicator (`AutoSaveIndicator`)

**Philosophy**: Trust through transparency.

- **Visuals**: Adapts color and icon based on state (Saving, Saved, Error).
- **Interaction**: Micro-animations (spinner, checkmark bounce).
- **Function**: Provides real-time confirmation that the draft is secure.
- **Why**: Eliminates the anxiety of "did I lose my work?".

### 3. Plan Action Bar (`PlanActionBar`)

**Philosophy**: Clear hierarchy in a floating command center.

- **Visuals**: Floating glass bar at the bottom of the screen.
- **Interaction**: Glow effects and smooth transitions.
- **Function**: Groups primary (Save) and secondary (Discard, Regenerate) actions.
- **Why**: Keeps critical actions accessible without cluttering the content area.

## Integration in `generate.tsx`

The main generation route has been refactored to:

- **Use the `usePlanGeneration` hook** for all state management.
- **Automatically detect drafts** and show the recovery banner.
- **Transform raw draft data** into the visual model required by `DirectPlanDisplay`.
- **Show the Action Bar** only when a plan is active.

## Design Details

- **Motion**: All new components use `motion/react` for fluid entrances and exits.
- **Glassmorphism**: Consistent usage of `backdrop-blur` and semi-transparent backgrounds.
- **Gradients**: Subtle usage of primary color gradients to indicate active states.
- **Typography**: Clean, legible, and hierarchical.

## How to Verify

1. **Visit `/generate`**: You should see the updated form.
2. **Generate a Plan**:
   - Watch the `AutoSaveIndicator` cycle from "Saving" to "Saved".
   - The `PlanActionBar` should appear at the bottom.
3. **Refresh the Page**:
   - The `DraftRecoveryBanner` should slide in from the bottom right.
   - Clicking "View Draft" should restore the plan instantly.
4. **Interact**:
   - "Save Plan" moves it to permanent storage.
   - "Discard" removes the draft and resets the view.

These changes elevate the user experience from a simple form to a robust, app-like tool.
