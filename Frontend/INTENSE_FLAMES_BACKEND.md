# IntenseFlames Status - Backend Implementation Complete ✅

## Overview
IntenseFlames is a special burning status applied by Lune's Fire Rage ability.

## Backend Implementation

### 1. Start of Turn Processing ✅
**Location:** BattleTurnController.kt (lines 131-142)

**Logic:**
- Automatically processed at START of turn
- For each character with IntenseFlames status:
  - Deal damage equal to current `ammount`
  - If character dies, effect removed automatically

### 2. End of Turn Processing ✅
**Location:** BattleTurnController.kt (lines 90-95)

**Logic:**
- Automatically processed at END of turn
- For each character with IntenseFlames status:
  - Increase `ammount` by 2
  - Keep `remainingTurns` at 999 (no expiration)

**Example:**
```
Turn 1 START: Enemy has IntenseFlames(3) → Takes 3 damage
Turn 1 END:   Enemy has IntenseFlames(3) → Becomes IntenseFlames(5)

Turn 2 START: Enemy has IntenseFlames(5) → Takes 5 damage
Turn 2 END:   Enemy has IntenseFlames(5) → Becomes IntenseFlames(7)

Turn 3 START: Enemy has IntenseFlames(7) → Takes 7 damage
Turn 3 END:   Enemy has IntenseFlames(7) → Becomes IntenseFlames(9)
```

### 3. Damage Received Handler ✅
**Location:** BattleCharacterService.kt (lines 214-221, 926-965)

**Logic:**
- When ANY character named "Lune" (or with id containing "lune") receives damage:
  - Find ALL enemies with IntenseFlames status
  - Remove IntenseFlames from ALL those enemies
  - Show appropriate message

**Conditions:**
- Triggers on ANY damage to Lune (attack, DoT, self-damage, etc.)
- Affects ALL enemies simultaneously
- Does NOT require Lune to die, just take any damage

### 4. Status Configuration
- Type: `IntenseFlames`
- Initial amount: 3 (from Fire Rage ability)
- Remaining turns: 999 (effectively infinite)
- Damage timing: Start of turn (deals damage equal to current stacks)
- Growth rate: +2 per turn (at end of turn)
- Removal: When source Lune takes damage

## Frontend Status
✅ Type added to StatusType enum
✅ Fire Rage skill updated to apply IntenseFlames
✅ Skill correctly configured (hitCount: 1, damageLevel: high)
✅ Status display adjusted (no turn count shown)

## Testing Checklist
- [ ] IntenseFlames starts at 3 stacks when applied
- [ ] At START of turn: deals damage equal to current stacks
- [ ] At END of turn: grows by 2 stacks
- [ ] IntenseFlames persists indefinitely (999 turns, no expiration)
- [ ] IntenseFlames removed from ALL enemies when Lune takes damage
- [ ] Multiple enemies can have IntenseFlames simultaneously
- [ ] Display shows "Chamas Intensas 3" (no turn count)
- [ ] Works with stain consumption (+50% damage when 2 Ice consumed)
