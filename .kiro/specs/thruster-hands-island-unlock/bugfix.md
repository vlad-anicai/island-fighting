# Bugfix Requirements Document

## Introduction

The Thruster Hands ability is currently purchasable on Island 3, but it should only become available starting on Island 4. The `unlocksAt` value in the ability shop definition is set to `3` instead of `4`, causing the ability to appear unlocked one island too early.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the player is on Island 3 (islandTheme = 3) AND opens the Ability Shop THEN the system displays Thruster Hands as available for purchase

1.2 WHEN the player is on Island 3 AND has sufficient coins THEN the system allows purchasing Thruster Hands

### Expected Behavior (Correct)

2.1 WHEN the player is on Island 3 (islandTheme = 3) AND opens the Ability Shop THEN the system SHALL display Thruster Hands as locked with the message "Unlocks on Island 4"

2.2 WHEN the player is on Island 3 AND has sufficient coins THEN the system SHALL NOT allow purchasing Thruster Hands

2.3 WHEN the player is on Island 4 (islandTheme = 4) AND opens the Ability Shop THEN the system SHALL display Thruster Hands as available for purchase

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the player is on Island 1 or Island 2 THEN the system SHALL CONTINUE TO display Thruster Hands as locked

3.2 WHEN the player is on Island 4 AND has sufficient coins THEN the system SHALL CONTINUE TO allow purchasing Thruster Hands

3.3 WHEN the player is on Island 4 AND has purchased Thruster Hands THEN the system SHALL CONTINUE TO allow assigning and activating the ability

3.4 WHEN any other island-locked ability (Slow Motion, Plasma Laser, Black Flash) is evaluated THEN the system SHALL CONTINUE TO apply its existing unlock island threshold unchanged
