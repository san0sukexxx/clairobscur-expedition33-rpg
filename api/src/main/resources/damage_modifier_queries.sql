-- ============================================
-- DAMAGE MODIFIER SYSTEM - USEFUL QUERIES
-- ============================================

-- ============================================
-- BASIC QUERIES
-- ============================================

-- View all modifiers in the system
SELECT
    dm.id,
    dm.battle_character_id,
    bc.character_name,
    dm.modifier_type,
    dm.multiplier,
    dm.flat_bonus,
    dm.condition_type,
    dm.is_active
FROM damage_modifier dm
JOIN battle_character bc ON dm.battle_character_id = bc.id
ORDER BY dm.battle_character_id, dm.id;

-- View only active modifiers
SELECT
    dm.id,
    bc.character_name,
    dm.modifier_type,
    dm.multiplier,
    dm.flat_bonus,
    dm.condition_type
FROM damage_modifier dm
JOIN battle_character bc ON dm.battle_character_id = bc.id
WHERE dm.is_active = 1
ORDER BY dm.battle_character_id;

-- Count modifiers per character
SELECT
    bc.character_name,
    COUNT(dm.id) as total_modifiers,
    SUM(CASE WHEN dm.is_active = 1 THEN 1 ELSE 0 END) as active_modifiers
FROM battle_character bc
LEFT JOIN damage_modifier dm ON bc.id = dm.battle_character_id
GROUP BY bc.id, bc.character_name
ORDER BY total_modifiers DESC;

-- ============================================
-- ANALYSIS QUERIES
-- ============================================

-- Find characters with the most damage potential
SELECT
    bc.character_name,
    ROUND(
        (SELECT
            CASE
                WHEN COUNT(*) = 0 THEN 1.0
                ELSE EXP(SUM(LN(multiplier)))
            END
        FROM damage_modifier
        WHERE battle_character_id = bc.id
        AND is_active = 1
        AND modifier_type IN ('all', 'base-attack')
        ), 2
    ) as total_multiplier,
    (SELECT COALESCE(SUM(flat_bonus), 0)
     FROM damage_modifier
     WHERE battle_character_id = bc.id
     AND is_active = 1) as total_flat_bonus
FROM battle_character bc
ORDER BY total_multiplier DESC, total_flat_bonus DESC;

-- Most common modifier types
SELECT
    modifier_type,
    COUNT(*) as count,
    ROUND(AVG(multiplier), 2) as avg_multiplier,
    ROUND(AVG(flat_bonus), 0) as avg_flat_bonus
FROM damage_modifier
WHERE is_active = 1
GROUP BY modifier_type
ORDER BY count DESC;

-- Most used conditions
SELECT
    COALESCE(condition_type, 'None') as condition,
    COUNT(*) as count
FROM damage_modifier
WHERE is_active = 1
GROUP BY condition_type
ORDER BY count DESC;

-- ============================================
-- MAINTENANCE QUERIES
-- ============================================

-- Disable all modifiers for a specific character
-- UPDATE damage_modifier
-- SET is_active = 0
-- WHERE battle_character_id = 1;

-- Enable all modifiers for a specific character
-- UPDATE damage_modifier
-- SET is_active = 1
-- WHERE battle_character_id = 1;

-- Remove all inactive modifiers (cleanup)
-- DELETE FROM damage_modifier
-- WHERE is_active = 0;

-- Remove modifiers for characters no longer in battle
-- DELETE FROM damage_modifier
-- WHERE battle_character_id NOT IN (SELECT id FROM battle_character);

-- Reset all modifiers to default multiplier
-- UPDATE damage_modifier
-- SET multiplier = 1.0
-- WHERE multiplier != 1.0;

-- ============================================
-- DEBUGGING QUERIES
-- ============================================

-- Check modifiers affecting a specific attack type
SELECT
    bc.character_name,
    dm.modifier_type,
    dm.multiplier,
    dm.flat_bonus,
    dm.condition_type
FROM damage_modifier dm
JOIN battle_character bc ON dm.battle_character_id = bc.id
WHERE dm.is_active = 1
AND (dm.modifier_type = 'base-attack' OR dm.modifier_type = 'all')
ORDER BY bc.character_name;

-- Find characters with conditional modifiers
SELECT
    bc.character_name,
    dm.modifier_type,
    dm.condition_type,
    dm.multiplier,
    dm.flat_bonus
FROM damage_modifier dm
JOIN battle_character bc ON dm.battle_character_id = bc.id
WHERE dm.condition_type IS NOT NULL
AND dm.is_active = 1
ORDER BY bc.character_name, dm.condition_type;

-- Calculate theoretical max damage for a character
-- (This assumes all conditions are met)
SELECT
    bc.character_name,
    bc.health_points as current_hp,
    bc.max_health_points as max_hp,
    ROUND(
        100 * (SELECT
            CASE
                WHEN COUNT(*) = 0 THEN 1.0
                ELSE EXP(SUM(LN(multiplier)))
            END
        FROM damage_modifier
        WHERE battle_character_id = bc.id
        AND is_active = 1
        ), 0
    ) as base_100_becomes,
    (SELECT COALESCE(SUM(flat_bonus), 0)
     FROM damage_modifier
     WHERE battle_character_id = bc.id
     AND is_active = 1) as plus_flat
FROM battle_character bc
WHERE bc.character_type = 'player'
ORDER BY base_100_becomes DESC;

-- ============================================
-- STATISTICS
-- ============================================

-- Overall statistics
SELECT
    COUNT(*) as total_modifiers,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_modifiers,
    COUNT(DISTINCT battle_character_id) as characters_with_modifiers,
    ROUND(AVG(multiplier), 2) as avg_multiplier,
    ROUND(AVG(flat_bonus), 0) as avg_flat_bonus,
    MAX(multiplier) as max_multiplier,
    MAX(flat_bonus) as max_flat_bonus
FROM damage_modifier;

-- Distribution of multipliers
SELECT
    CASE
        WHEN multiplier >= 2.0 THEN '2.0x+'
        WHEN multiplier >= 1.5 THEN '1.5x-1.99x'
        WHEN multiplier >= 1.2 THEN '1.2x-1.49x'
        WHEN multiplier >= 1.0 THEN '1.0x-1.19x'
        ELSE 'Below 1.0x'
    END as multiplier_range,
    COUNT(*) as count
FROM damage_modifier
WHERE is_active = 1
GROUP BY
    CASE
        WHEN multiplier >= 2.0 THEN '2.0x+'
        WHEN multiplier >= 1.5 THEN '1.5x-1.99x'
        WHEN multiplier >= 1.2 THEN '1.2x-1.49x'
        WHEN multiplier >= 1.0 THEN '1.0x-1.19x'
        ELSE 'Below 1.0x'
    END
ORDER BY
    CASE
        WHEN multiplier >= 2.0 THEN 1
        WHEN multiplier >= 1.5 THEN 2
        WHEN multiplier >= 1.2 THEN 3
        WHEN multiplier >= 1.0 THEN 4
        ELSE 5
    END;

-- ============================================
-- REPORTS
-- ============================================

-- Character Power Report
SELECT
    bc.character_name,
    bc.character_type,
    bc.health_points || '/' || bc.max_health_points as hp,
    COALESCE(bc.magic_points, 0) || '/' || COALESCE(bc.max_magic_points, 0) as mp,
    COUNT(dm.id) as modifier_count,
    ROUND(
        (SELECT
            CASE
                WHEN COUNT(*) = 0 THEN 1.0
                ELSE EXP(SUM(LN(multiplier)))
            END
        FROM damage_modifier
        WHERE battle_character_id = bc.id
        AND is_active = 1
        AND modifier_type = 'all'
        ), 2
    ) as universal_multiplier,
    (SELECT COALESCE(SUM(flat_bonus), 0)
     FROM damage_modifier
     WHERE battle_character_id = bc.id
     AND is_active = 1) as total_flat_bonus
FROM battle_character bc
LEFT JOIN damage_modifier dm ON bc.id = dm.battle_character_id AND dm.is_active = 1
GROUP BY bc.id, bc.character_name, bc.character_type, bc.health_points, bc.max_health_points, bc.magic_points, bc.max_magic_points
ORDER BY bc.character_type, universal_multiplier DESC;

-- Battle Damage Potential Report
SELECT
    b.id as battle_id,
    b.battle_status,
    bc.character_name,
    bc.is_enemy,
    CASE
        WHEN bc.is_enemy = 0 THEN 'Team A'
        ELSE 'Team B'
    END as team,
    COUNT(dm.id) as active_modifiers,
    ROUND(100 * (SELECT
        CASE
            WHEN COUNT(*) = 0 THEN 1.0
            ELSE EXP(SUM(LN(multiplier)))
        END
        FROM damage_modifier
        WHERE battle_character_id = bc.id
        AND is_active = 1
    ), 0) as damage_from_100
FROM battle b
JOIN battle_character bc ON b.id = bc.battle_id
LEFT JOIN damage_modifier dm ON bc.id = dm.battle_character_id AND dm.is_active = 1
GROUP BY b.id, b.battle_status, bc.character_name, bc.is_enemy, bc.id
ORDER BY b.id, bc.is_enemy, damage_from_100 DESC;

-- ============================================
-- EXAMPLES FOR TESTING
-- ============================================

-- Example: Add test modifier (+50% to all attacks)
-- INSERT INTO damage_modifier (battle_character_id, modifier_type, multiplier, flat_bonus, condition_type, is_active)
-- VALUES (1, 'all', 1.5, 0, NULL, 1);

-- Example: Add conditional modifier (+30% when HP is full)
-- INSERT INTO damage_modifier (battle_character_id, modifier_type, multiplier, flat_bonus, condition_type, is_active)
-- VALUES (1, 'all', 1.3, 0, 'full-hp', 1);

-- Example: Add flat damage bonus (+25 damage)
-- INSERT INTO damage_modifier (battle_character_id, modifier_type, multiplier, flat_bonus, condition_type, is_active)
-- VALUES (1, 'all', 1.0, 25, NULL, 1);

-- ============================================
-- PERFORMANCE MONITORING
-- ============================================

-- Check index usage (if your database supports EXPLAIN)
-- EXPLAIN QUERY PLAN
-- SELECT * FROM damage_modifier WHERE battle_character_id = 1 AND is_active = 1;

-- Find potential duplicate modifiers
SELECT
    battle_character_id,
    modifier_type,
    multiplier,
    flat_bonus,
    condition_type,
    COUNT(*) as duplicates
FROM damage_modifier
WHERE is_active = 1
GROUP BY battle_character_id, modifier_type, multiplier, flat_bonus, condition_type
HAVING COUNT(*) > 1;
