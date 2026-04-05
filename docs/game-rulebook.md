# Game Rulebook

## Purpose

This document defines the first-pass game layer that sits on top of the contract system.

The purpose of the game layer is:

- to help users and companions focus on the right objectives
- to make progress visible
- to make verification rewarding
- to turn structured work into a guided board with clear next actions

This layer should improve motivation and prioritization.

It should not replace or weaken the underlying contract system.

## Governing Rule

The game layer must sit above the contract layer.

That means:

- canon still decides what is allowed
- runtime ownership still decides where data writes
- verification still decides what becomes trusted
- the game layer only decides:
  - priority
  - progress
  - points
  - quests
  - ranking
  - explanation

Working rule:

- game should guide
- contract should govern

## Core Objects

### 1. Points

Points measure useful progress.

There are two kinds of points:

- provisional points
  - awarded when useful work is proposed or entered
  - not yet fully trusted

- realized points
  - awarded when that work is verified as correct
  - counted as true progress

### 2. Deductions

Points should be deducted when:

- information is wrong
- a claimed completion is later disproven
- a required field was filled incorrectly
- a relationship was proposed incorrectly and rejected

### 3. Bonuses

Bonus points should be awarded when:

- a required field group is completed correctly
- a full record is completed correctly
- a full stage pass is completed correctly
- a high-priority quest is completed cleanly

### 4. Quests

Quests are concrete objectives.

They should tell the user or companion:

- what matters next
- why it matters
- what success looks like
- what reward is attached to it

### 5. Boards

Each pipeline should function as a board.

Each board should have:

- stage objectives
- required information
- expected outcomes
- ranking logic
- quest priority

### 6. Game Master

The `Game Master` is the guide layer that explains the board, updates the ranking, and keeps the user moving toward the most relevant objectives.

The Game Master should:

- explain the current board
- explain why points changed
- explain what is most relevant next
- explain what is blocking progress
- keep guidance fun, motivating, and clear

The Game Master should not:

- invent structure
- override ownership
- mark unverified information as settled truth

## Point Flow

The intended first-pass point flow is:

1. information is entered or proposed
2. provisional points are awarded
3. user verification or approved review happens
4. provisional points are either:
   - realized if correct
   - reduced or removed if wrong

Working principle:

- effort can be rewarded early
- truth is only rewarded fully after verification

## Example Scoring Logic

Examples of early scoring behavior:

- filling a JSON field gives provisional points
- linking a canon-declared KDB relationship gives provisional points
- completing a required field group gives a provisional bonus
- completing a full record gives a provisional bonus

Examples of realization behavior:

- verified correct field -> realized points
- verified correct relationship -> realized points
- verified full record -> realized completion bonus
- wrong field or wrong relationship -> deduction

## Quest Logic

Quests should be ranked by relevance, not just by difficulty.

That means the game layer should prioritize:

- required information before optional information
- blocking fields before decorative fields
- stage-critical work before low-impact work
- verified progress before speculative expansion

Working rule:

- the game layer should surface what matters most now
- not merely what is easiest to score

## Pipeline Board Rule

Each pipeline board should define:

- the current stage
- the expected outcome for that stage
- the information that must be completed for that stage
- the bonus logic for a clean stage pass
- the penalties for incorrect or misleading completion

The board should help the user understand:

- what they are trying to accomplish
- how complete they are
- what still blocks advancement

## Companion Role

The `Companion` should help the user navigate the game layer and score points in a useful way.

That means the Companion may:

- explain quests
- explain ranking
- explain what points are provisional
- explain what will realize points
- explain what needs verification next
- help the user focus on the most relevant next task

But the Companion must still obey the companion contract:

- helpful about content
- strict about structure
- honest about missing ownership

## Current Scope

This is a first-pass rulebook.

Current purpose:

- define how the game layer should work
- align it with the current contract system
- keep the team aware that the current main objective is still underlying structure correctness

Current rule:

- the game layer may help surface issues
- the game layer must not distract from getting the ownership and runtime structure correct underneath
