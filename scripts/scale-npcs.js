const fs = require('fs');
const path = require('path');

// ── NPC-to-story-location mapping (earliest occurrence) ──
const npcToTier = {
    // Location 0 (lumiere)
    "mime": 0,
    // Location 1 (spring-meadows)
    "jar": 1, "portier": 1, "lancer": 1, "volester": 1, "abbest": 1, "chromatic-lancelier": 1, "eveque": 1, "chromatic-portier": 1,
    // Location 2 (flying-waters)
    "noco": 2, "luster": 2, "demineur": 2, "bruler": 2, "cruler": 2, "mime-flying-waters": 2, "bourgeon": 2, "chromatic-troubadour": 2, "goblu": 2,
    // Location 3 (ancient-sanctuary)
    "petank": 3, "robust-sakapatate": 3, "catapult-sakapatate": 3, "ranger-sakapatate": 3, "mime-ancient-sanctuary": 3, "ultimate-sakapatate": 3,
    // Location 4 (gestral-village)
    "gestral-warrior": 4, "golgra": 4, "jujubree": 4, "eesda": 4,
    // Location 5 (esquies-nest)
    "esquie": 5, "mime-esquies-nest": 5, "petank-esquies-nest": 5, "francois": 5,
    // Location 6 (stone-wave-cliffs)
    "jerijeri": 6, "hexga": 6, "reaper-cultist": 6, "greatsword-cultist": 6, "gold-chevaliere": 6, "petank-stone-wave-cliffs": 6, "rocher": 6, "lampmaster-phase1": 6, "lampmaster-phase2": 6, "chromatic-gault": 6, "chromatic-rocher": 6,
    // Location 7 (forgotten-battlefield)
    "chalier": 7, "petank-battlefield": 7, "ramasseur": 7, "troubadour": 7, "cruler-battlefield": 7, "dualliste-phase1": 7, "dualliste-phase2": 7, "chromatic-luster": 7,
    // Location 8 (monocos-station)
    "stalact": 8,
    // Location 9 (old-lumiere)
    "steel-chevaliere": 9, "ceramic-chevaliere": 9, "renoir": 9, "chromatic-danseuses": 9,
    // Location 10 (visages)
    "boucheclier": 10, "contortionniste-visages": 10, "moissoneusse-visages": 10, "chapelier": 10, "chromatic-ramasseur": 10, "seething-boucheclier": 10, "jovial-moissonneuse": 10, "sorrowful-chapelier": 10, "visages": 10, "mask-keeper": 10,
    // Location 11 (sirene)
    "ballet-sirene": 11, "chorale": 11, "benisseur": 11, "petank-sirene": 11, "chromatic-greatsword-cultist": 11, "tisseur": 11, "glissando": 11, "sirene": 11,
    // Location 12 (the-monolith)
    "lancer-monolith": 12, "abbest-monolith": 12, "portier-monolith": 12, "clair": 12, "bruler-monolith": 12, "cruler-monolith": 12, "demineur-monolith": 12, "ranger-sakapatate-monolith": 12, "robust-sakapatate-monolith": 12, "catapult-sakapatate-monolith": 12, "reaper-cultist-monolith": 12, "greatsword-cultist-monolith": 12, "petank-monolith": 12, "mime-monolith": 12, "obscur": 12, "hexga-monolith": 12, "chalier-monolith": 12, "troubadour-monolith": 12, "ramasseur-monolith": 12, "danseuses": 12, "ceramic-chevaliere-monolith": 12, "gold-chevaliere-monolith": 12, "pelerin": 12, "braseleur": 12, "the-paintress": 12, "eveque-monolith": 12, "chromatic-bourgeon": 12, "ultimate-sakapatate-monolith": 12, "gargant": 12, "clair-obscur": 12, "renoir-monolith": 12, "chromatic-clair-obscur": 12,
    // Location 13 (the-manor)
    "the-curator": 13, "clea": 13, "gold-chevaliere-manor": 13, "rocher-manor": 13,
    // Location 14 (lumiere-act-3)
    "aberration-act3": 14, "contortionniste-act3": 14, "moissoneusse-act3": 14, "orphelin-act3": 14, "ballet-act3": 14, "mime-act3": 14, "lumiere-citizen-act3": 14, "renoir-act3": 14, "creation-act3": 14, "chromatic-echassier": 14,
};

// ── Tier tables ──
const crRegular = ["1/4", "1", "2", "3", "4", "5", "6", "8", "9", "11", "13", "15", "17", "18", "20"];
const crBoss    = ["1",  "3", "4", "5", "6", "8", "9", "11", "12", "14", "16", "18", "20", "20", "22"];

const acRegular = [10, 12, 13, 14, 14, 15, 16, 17, 17, 18, 18, 19, 20, 20, 21];
const acBoss    = [12, 14, 15, 16, 16, 17, 18, 19, 19, 20, 20, 21, 22, 22, 23];

// Target TOTAL damage per hit (die + strMod + additionalDamage)
// additionalDamage is computed as: target - die_avg - strMod (per NPC, normalizes stat variance)
// High tiers scale aggressively to threaten high-HP players
//                                t0  t1  t2  t3   t4   t5   t6   t7   t8   t9  t10  t11  t12  t13  t14
const targetBasicDmg           = [4,  5,  5,  6,   7,   8,   9,  10,  13,  15,  17,  22,  28,  30,  36];
const targetSkillDmg           = [5,  6,  7,  8,  10,  11,  13,  14,  18,  21,  24,  32,  40,  44,  52];

// Target TOTAL HP per NPC (maxLifeBonus = targetHP - scaledCON, per NPC)
// This normalizes: high-CON NPCs get less bonus, low-CON NPCs get more
// High tiers (8+) scale aggressively to match player weapon/picto power spikes
//                      t0  t1  t2  t3  t4  t5  t6  t7  t8   t9  t10  t11  t12  t13  t14
const targetHPRegular = [18, 22, 24, 28, 34, 38, 42, 46, 55,  65,  75,  90, 130, 140, 180];
const targetHPBoss    = [32, 40, 44, 50, 62, 68, 76, 84, 100, 120, 140, 170, 240, 260, 340];

function getDamageDie(tier) {
    if (tier <= 2) return 4;
    if (tier <= 6) return 6; // 6 is default, will remove
    if (tier <= 10) return 8;
    return 10;
}

function getProficiencyBonus(tier) {
    if (tier <= 4) return 2; // 2 is default, will remove
    if (tier <= 6) return 3;
    if (tier <= 8) return 4;
    if (tier <= 10) return 5;
    if (tier <= 12) return 6;
    return 7;
}

// ── File I/O ──
const filePath = path.join(__dirname, '..', 'Frontend', 'src', 'data', 'NPCsList.ts');
let content = fs.readFileSync(filePath, 'utf8');
// Normalize line endings to LF for processing
const originalHasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// We'll parse each NPC block, find its id, check if it's in the tier map, and modify it.
// Strategy: find each object block in the array, parse/modify field by field using regex.

// Split the file into NPC blocks. Each block starts with `    {` and ends with `    },`
// We'll use a state machine approach.

const lines = content.split('\n');
const outputLines = [];
let i = 0;

while (i < lines.length) {
    const line = lines[i];

    // Detect start of an NPC block (indented with 4 spaces, opening brace)
    if (/^    \{/.test(line) && !line.includes('type:') && !line.includes('itemId:')) {
        // Collect the entire block
        const blockStart = i;
        let braceCount = 0;
        let blockLines = [];
        let j = i;
        while (j < lines.length) {
            blockLines.push(lines[j]);
            braceCount += (lines[j].match(/\{/g) || []).length;
            braceCount -= (lines[j].match(/\}/g) || []).length;
            if (braceCount === 0) break;
            j++;
        }
        i = j + 1;

        // Extract NPC id
        const idMatch = blockLines.join('\n').match(/id:\s*"([^"]+)"/);
        if (!idMatch) {
            outputLines.push(...blockLines);
            continue;
        }

        const npcId = idMatch[1];
        const tier = npcToTier[npcId];

        if (tier === undefined) {
            // Not a story NPC, leave unchanged
            outputLines.push(...blockLines);
            continue;
        }

        // Determine if boss
        const isBoss = blockLines.some(l => /isBoss:\s*true/.test(l));

        // Apply transformations
        const transformedBlock = transformNpcBlock(blockLines, npcId, tier, isBoss);
        outputLines.push(...transformedBlock);
        continue;
    }

    outputLines.push(line);
    i++;
}

function transformNpcBlock(blockLines, npcId, tier, isBoss) {
    let result = [...blockLines];
    const block = result.join('\n');

    // Extract base ability scores before scaling
    const getScore = (attr) => {
        const m = block.match(new RegExp(`${attr}:\\s+(\\d+)`));
        return m ? parseInt(m[1]) : 10;
    };
    const baseSTR = getScore('strength');
    const baseCON = getScore('constitution');

    // 1. Scale attributes
    const factor = 1.0 + (tier / 14) * 0.35;
    const attrs = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    for (const attr of attrs) {
        result = result.map(line => {
            const match = line.match(new RegExp(`^(\\s+${attr}:\\s+)(\\d+)(,?.*)$`));
            if (match) {
                const orig = parseInt(match[2]);
                const scaled = Math.min(30, Math.max(4, Math.round(orig * factor)));
                const origStr = match[2];
                let newStr = String(scaled);
                while (newStr.length < origStr.length) newStr = ' ' + newStr;
                return match[1] + newStr + match[3];
            }
            return line;
        });
    }

    // Compute scaled stats for HP/damage normalization
    const scaledSTR = Math.min(30, Math.max(4, Math.round(baseSTR * factor)));
    const scaledCON = Math.min(30, Math.max(4, Math.round(baseCON * factor)));
    const strMod = Math.floor((scaledSTR - 10) / 2);

    // 2. Set armorClass
    const targetAC = isBoss ? acBoss[tier] : acRegular[tier];
    result = setOrAddNumericProperty(result, 'armorClass', targetAC);

    // 3. Set challengeRating
    const targetCR = isBoss ? crBoss[tier] : crRegular[tier];
    result = setOrAddStringProperty(result, 'challengeRating', targetCR);

    // 4. Set proficiencyBonus
    const targetPB = getProficiencyBonus(tier);
    if (targetPB === 2) {
        result = removeProperty(result, 'proficiencyBonus');
    } else {
        result = setOrAddNumericProperty(result, 'proficiencyBonus', targetPB);
    }

    // 5. Set damageDie
    const targetDD = getDamageDie(tier);
    if (targetDD === 6) {
        result = removeProperty(result, 'damageDie');
    } else {
        result = setOrAddNumericProperty(result, 'damageDie', targetDD);
    }

    // 6. Analyze attack structure for power normalization
    const attackPower = computeAttackPower(block);

    // 7. Set maxLifeBonus — NORMALIZED per NPC
    // Adjustments: Physical resistance, attack power (high DPR NPCs need less HP)
    const resistsPhysical = block.includes('resistentTo: "Physical"') || block.match(/resistentTo:.*"Physical"/);
    const immuneToPhysical = block.includes('imuneTo: "Physical"') || block.match(/imuneTo:.*"Physical"/);
    let hpFactor = 1.0;
    if (immuneToPhysical) hpFactor *= 0.3;
    else if (resistsPhysical) hpFactor *= 0.5;
    // High-DPR NPCs (multi-hit, AOE) need less HP for balanced fight duration
    // Only apply significant reduction for truly high multipliers (>2)
    if (attackPower.avgMultiplier > 1.5) {
        hpFactor /= Math.pow(attackPower.avgMultiplier / 1.5, 0.5);
    }

    const baseTargetHP = isBoss ? targetHPBoss[tier] : targetHPRegular[tier];
    const targetHP = Math.max(scaledCON + 1, Math.round(baseTargetHP * hpFactor));
    const mlb = Math.max(0, targetHP - scaledCON);
    result = setOrAddNumericProperty(result, 'maxLifeBonus', mlb);

    // 8. Scale attacks — NORMALIZED per NPC (targetDmg - dieAvg - strMod)
    const dieAvg = targetDD / 2 + 0.5;
    result = scaleAttacks(result, tier, isBoss, strMod, dieAvg);

    return result;
}

/** Analyze all attacks in an NPC block to compute effective DPR multiplier */
function computeAttackPower(block) {
    const lines = block.split('\n');
    const attackLines = lines.filter(l =>
        l.includes('type: "basic"') || l.includes('type: "skill"')
    );

    if (attackLines.length === 0) return { avgMultiplier: 1.0 };

    let totalMult = 0;
    for (const line of attackLines) {
        // Only count attacks that deal damage (have additionalDamage or are basic)
        const hasDamage = line.includes('additionalDamage:') || line.includes('type: "basic"');
        if (!hasDamage) continue;

        const qtyMatch = line.match(/quantity:\s*(\d+)/);
        const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

        const isAOE = line.includes('targetsAll: true') || line.includes('targeting: "all"');

        const intMatch = line.match(/intensity:\s*"(\w+)"/);
        const intDice = intensityToDiceFactor(intMatch ? intMatch[1] : null);

        // Effective multiplier: how much more damage than a single basic hit
        let mult = quantity * intDice;
        if (isAOE) mult *= 2.5; // hits 3 targets (slightly less than 3x due to overkill)

        totalMult += mult;
    }

    const damageAttacks = attackLines.filter(l =>
        l.includes('additionalDamage:') || l.includes('type: "basic"')
    ).length;

    const avg = damageAttacks > 0 ? totalMult / damageAttacks : 1.0;
    return { avgMultiplier: Math.max(1.0, avg) };
}

function intensityToDiceFactor(intensity) {
    // Effective damage multiplier from extra dice (diminishing returns)
    switch (intensity) {
        case 'high': return 1.6;      // 2 dice
        case 'veryHigh': return 2.0;   // 3 dice
        case 'extreme': return 2.3;    // 4 dice
        case 'maximum': return 2.5;    // 5 dice
        default: return 1.0;           // 1 die
    }
}

function setOrAddNumericProperty(lines, prop, value) {
    const regex = new RegExp(`^(\\s+${prop}:\\s*)\\d+(,?.*)$`);
    let found = false;
    const result = lines.map(line => {
        const match = line.match(regex);
        if (match) {
            found = true;
            return match[1] + value + match[2];
        }
        return line;
    });

    if (!found) {
        // Add after challengeRating or armorClass or charisma line
        const insertAfter = findInsertionPoint(result, prop);
        if (insertAfter >= 0) {
            const indent = '        ';
            result.splice(insertAfter + 1, 0, `${indent}${prop}: ${value},`);
        }
    }
    return result;
}

function setOrAddStringProperty(lines, prop, value) {
    const regex = new RegExp(`^(\\s+${prop}:\\s*)"[^"]*"(,?.*)$`);
    let found = false;
    const result = lines.map(line => {
        const match = line.match(regex);
        if (match) {
            found = true;
            return match[1] + `"${value}"` + match[2];
        }
        return line;
    });

    if (!found) {
        const insertAfter = findInsertionPoint(result, prop);
        if (insertAfter >= 0) {
            const indent = '        ';
            result.splice(insertAfter + 1, 0, `${indent}${prop}: "${value}",`);
        }
    }
    return result;
}

function removeProperty(lines, prop) {
    const regex = new RegExp(`^\\s+${prop}:\\s*\\S+,?\\s*$`);
    return lines.filter(line => !regex.test(line));
}

function findInsertionPoint(lines, prop) {
    // Property insertion order preference
    const order = ['id', 'isBoss', 'playFirst', 'passives', 'noBasicAttack',
        'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
        'freeShotWeakPoints', 'isFlying', 'weakTo', 'resistentTo', 'absorbElement', 'imuneTo',
        'armorClass', 'challengeRating', 'proficiencyBonus', 'damageDie', 'maxLifeBonus',
        'conditionImmunities', 'attackList', 'drops'];

    const propIdx = order.indexOf(prop);

    // Find the last line with a property that comes before this one in the order
    let bestLine = -1;
    for (let i = 0; i < lines.length; i++) {
        for (let j = 0; j < propIdx; j++) {
            const re = new RegExp(`^\\s+${order[j]}[:\\s]`);
            if (re.test(lines[i])) {
                bestLine = i;
            }
        }
    }

    // If inserting after a multi-line property (like weakTo array), find the end
    if (bestLine >= 0) {
        // Check if this line has unclosed brackets
        let line = lines[bestLine];
        if (line.includes('[') && !line.includes(']')) {
            while (bestLine < lines.length - 1 && !lines[bestLine].includes(']')) {
                bestLine++;
            }
        }
    }

    return bestLine;
}

function scaleAttacks(lines, tier, isBoss, strMod, dieAvg) {
    // Process each line that looks like an attack entry
    return lines.map(line => {
        // Check if this is an attack line
        if (!line.includes('type: "basic"') && !line.includes('type: "skill"')) {
            return line;
        }

        const isSkill = line.includes('type: "skill"');

        // Scale additionalDamage (normalized per NPC)
        line = scaleAdditionalDamage(line, tier, isBoss, isSkill, strMod, dieAvg);

        // Scale additionalDices
        line = scaleAdditionalDices(line, tier, isSkill);

        return line;
    });
}

function scaleAdditionalDamage(line, tier, isBoss, isSkill, strMod, dieAvg) {
    const match = line.match(/(additionalDamage:\s*)(\d+)/);

    if (match) {
        // Normalized: additionalDamage = targetTotalDmg - die_avg - strMod
        const targetDmg = isSkill ? targetSkillDmg[tier] : targetBasicDmg[tier];
        let newDamage = Math.max(0, Math.round(targetDmg - dieAvg - strMod));
        if (isBoss) {
            newDamage += 3;
        }

        // Compute this attack's effective multiplier and scale down proportionally
        const qtyMatch = line.match(/quantity:\s*(\d+)/);
        const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;
        const isAOE = line.includes('targetsAll: true') || line.includes('targeting: "all"');
        const intMatch = line.match(/intensity:\s*"(\w+)"/);
        const intFactor = intensityToDiceFactor(intMatch ? intMatch[1] : null);

        // Total effective multiplier for this attack
        let attackMult = quantity * intFactor;
        if (isAOE) attackMult *= 2.5;

        // Scale down per-hit damage so total effective output stays near target
        // Use gentler exponent to avoid over-nerfing moderate multi-hit NPCs
        if (attackMult > 1.5) {
            newDamage = Math.max(0, Math.round(newDamage / Math.pow(attackMult / 1.5, 0.6)));
        }

        line = line.replace(/(additionalDamage:\s*)\d+/, `$1${newDamage}`);
    }

    return line;
}

function scaleAdditionalDices(line, tier, isSkill) {
    const match = line.match(/(additionalDices:\s*)(\d+)/);
    const hasDices = !!match;
    const currentDices = hasDices ? parseInt(match[2]) : 0;

    let newDices = currentDices;

    if (tier >= 0 && tier <= 3) {
        // Keep as-is
        newDices = currentDices;
    } else if (tier >= 4 && tier <= 6) {
        if (hasDices) {
            newDices = currentDices; // keep
        } else if (isSkill) {
            newDices = 1; // add 1 for skills
        }
    } else if (tier >= 7 && tier <= 10) {
        if (hasDices) {
            newDices = Math.max(currentDices, 1);
        } else if (isSkill) {
            newDices = 1;
        }
    } else if (tier >= 11 && tier <= 14) {
        if (hasDices) {
            newDices = Math.max(currentDices, 2);
        } else if (isSkill) {
            newDices = 2;
        }
    }

    if (hasDices) {
        line = line.replace(/(additionalDices:\s*)\d+/, `$1${newDices}`);
    } else if (newDices > 0 && isSkill) {
        // Need to add additionalDices after additionalDamage
        // Only add if the line has additionalDamage (i.e. it's a damage skill)
        if (line.includes('additionalDamage:')) {
            line = line.replace(/(additionalDamage:\s*\d+)/, `$1, additionalDices: ${newDices}`);
        }
    }

    return line;
}

// Write output - restore original line endings
let output = outputLines.join('\n');
if (originalHasCRLF) {
    output = output.replace(/\n/g, '\r\n');
}
fs.writeFileSync(filePath, output, 'utf8');

console.log('NPC scaling complete!');
console.log(`Total NPCs in story: ${Object.keys(npcToTier).length}`);

// Print some examples
const tierCounts = {};
for (const [id, tier] of Object.entries(npcToTier)) {
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
}
console.log('NPCs per tier:', tierCounts);
