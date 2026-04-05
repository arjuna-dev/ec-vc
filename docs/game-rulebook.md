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

## Point Structure Rule

The point structure should be driven by data relevancy.

That means:

- points are not flat by task type alone
- points depend on what matters most at the current stage
- the same action may be worth more or less depending on context

Example:

- when setting a new `Opportunity`, linking the parent company should usually be worth more than adding a related contact
- this is because the company usually anchors more downstream understanding, more pairing links, and more structural context

Working rule:

- score what is most structurally and operationally relevant now
- do not score everything as if it had equal value

This should also inform ranking and front-loading:

- likely options may be ranked by what is worth the most now
- the point model can help companions and users see which choices are most relevant
- this ranking may help order human-facing options and bot-facing suggestions
- but it must not alter ownership or write-path truth

## Base-10 Scoring Rule

To keep the scoring language clear, use a base-10 system.

The intended scoring family is:

- `1`
- `2`
- `3`
- `4`
- `10`
- `100`
- `1000`

Meaning:

- `1, 2, 3, 4`
  - small distinctions inside one local scoring band
- `10`
  - one higher relevance band
- `100`
  - one much higher relevance band
- `1000`
  - one top-order relevance band

Working rule:

- use `1, 2, 3, 4` for local weight differences
- use `10, 100, 1000` to express order-of-importance jumps
- keep the scoring easy to read for users, companions, and future bots

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

The `Companion` should be understood as the guide helping the user navigate the game and score points in a useful way.

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

## Relevancy Rule

Points should be dynamic by stage and objective.

That means the system should ask:

- what is the current board
- what is the current stage
- what information is most important right now
- what information unlocks the most downstream value right now

Examples:

- if the stage is still forming the core shape of an `Opportunity`, company linkage may deserve a `10` band while secondary contacts may remain in a `2` or `3` band
- if a later stage depends heavily on stakeholder follow-up, contact completeness may move up in value

Working rule:

- points should track current relevance
- points should not be permanently fixed just because a field or link exists

## Example Scoring Logic

Examples of early scoring behavior:

- filling a low-impact field may give provisional `1`, `2`, `3`, or `4`
- filling a stage-critical field may give provisional `10`
- linking a high-value canon-declared relationship may give provisional `10` or `100`
- completing a required field group gives a provisional bonus
- completing a full record gives a provisional bonus

Examples of realization behavior:

- verified correct field -> realized points
- verified correct relationship -> realized points
- verified full record -> realized completion bonus
- wrong field or wrong relationship -> deduction in the same scoring band it occupied

## Bonus Rule

Bonus logic should also follow relevance.

That means:

- completing a low-importance cluster should not be rewarded like completing a stage-critical cluster
- finishing a full record with the correct required fields should score more than filling the same number of low-impact extras
- completing a full stage pass cleanly should be one of the strongest reward moments on a board

Working rule:

- bonuses should reward meaningful completion
- not just volume

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

## Human-System Relevance

The game layer should repeatedly reinforce the human-system distinction:

- `Owner`
  - system authority
  - node founder identity
  - origin of top-level control

- `User`
  - application actor
  - permissions and participation layer

- `Contact`
  - person record inside the CRM/KDB layer

This matters because not all human links mean the same thing.

Working rule:

- identity and authority links should usually score as higher-order structural work
- generic social or network links should not automatically outrank root-established human-system links

## Field-Class Scoring Rule

The point system should respect field class.

That means:

- `owned_field`
  - score by local relevance and correctness

- `directional_link`
  - score strongly when it establishes identity, authority, provenance, or parentage correctly

- `kdb_relationship`
  - score by stage relevance and downstream value

Working rule:

- do not reward a low-impact relationship like a high-impact root-established link
- use the field class, stage, and board objective together when ranking work

## Pipeline Board Rule

Each pipeline board should define:

- the current stage
- the expected outcome for that stage
- the information that must be completed for that stage
- the point weighting for what matters most at that stage
- the bonus logic for a clean stage pass
- the penalties for incorrect or misleading completion

The board should help the user understand:

- what they are trying to accomplish
- how complete they are
- what still blocks advancement
- why some actions are worth more than others right now

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
