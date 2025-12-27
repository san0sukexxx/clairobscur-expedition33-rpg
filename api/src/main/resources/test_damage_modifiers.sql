-- Test script for damage modifier system
-- This script demonstrates how to use the damage_modifier table

-- Example 1: Add a base attack damage modifier (+50% damage)
-- INSERT INTO damage_modifier (battle_character_id, modifier_type, multiplier, flat_bonus, condition_type, is_active)
-- VALUES (1, 'base-attack', 1.5, 0, NULL, 1);

-- Example 2: Add a counter damage modifier (+100% damage when countering)
-- INSERT INTO damage_modifier (battle_character_id, modifier_type, multiplier, flat_bonus, condition_type, is_active)
-- VALUES (1, 'counter', 2.0, 0, NULL, 1);

-- Example 3: Add a conditional modifier (+30% damage when at full HP)
-- INSERT INTO damage_modifier (battle_character_id, modifier_type, multiplier, flat_bonus, condition_type, is_active)
-- VALUES (1, 'all', 1.3, 0, 'full-hp', 1);

-- Example 4: Add a flat bonus damage (+10 damage to all attacks)
-- INSERT INTO damage_modifier (battle_character_id, modifier_type, multiplier, flat_bonus, condition_type, is_active)
-- VALUES (1, 'all', 1.0, 10, NULL, 1);

-- Example 5: Add a conditional modifier (+50% damage when enemy is burning)
-- INSERT INTO damage_modifier (battle_character_id, modifier_type, multiplier, flat_bonus, condition_type, is_active)
-- VALUES (1, 'skill', 1.5, 0, 'enemy-burning', 1);

-- Example 6: Add first-hit bonus (+20 damage on first hit)
-- INSERT INTO damage_modifier (battle_character_id, modifier_type, multiplier, flat_bonus, condition_type, is_active)
-- VALUES (1, 'first-hit', 1.0, 20, NULL, 1);

-- Query to view all modifiers for a character
-- SELECT * FROM damage_modifier WHERE battle_character_id = 1;

-- Query to view only active modifiers
-- SELECT * FROM damage_modifier WHERE battle_character_id = 1 AND is_active = 1;

-- Deactivate a modifier
-- UPDATE damage_modifier SET is_active = 0 WHERE id = 1;

-- Activate a modifier
-- UPDATE damage_modifier SET is_active = 1 WHERE id = 1;

-- Remove a modifier
-- DELETE FROM damage_modifier WHERE id = 1;

-- Test calculation example:
-- If a character has:
--   - Base damage: 100
--   - Modifier 1: 1.5x multiplier (base-attack)
--   - Modifier 2: +10 flat bonus (all)
-- Final damage = (100 * 1.5) + 10 = 160

-- Multiple multipliers stack multiplicatively:
-- If a character has:
--   - Base damage: 100
--   - Modifier 1: 1.5x multiplier
--   - Modifier 2: 1.3x multiplier
--   - Modifier 3: +20 flat bonus
-- Final damage = (100 * 1.5 * 1.3) + 20 = 215

-- Supported modifier_type values:
-- - 'base-attack': Applies to basic attacks
-- - 'counter': Applies to counter attacks
-- - 'free-aim': Applies to free shot attacks
-- - 'skill': Applies to skill attacks
-- - 'first-hit': Applies to the first hit only
-- - 'all': Applies to all attack types

-- Supported condition_type values:
-- - 'solo': Character is fighting alone (no allies)
-- - 'full-hp': Character is at full HP
-- - 'low-hp': Character is below 30% HP
-- - 'enemy-burning': Target has Burning status
-- - 'enemy-marked': Target has Marked status
-- - 'enemy-fragile': Target has Fragile status
-- - 'has-charges': Character has charge points
-- - 'max-charges': Character has max charge points
-- - 'twilight-active': Character has Twilight status
-- - NULL: No condition (always active)
