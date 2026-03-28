const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════════════════════
// Battle Simulator — Clair Obscur: Expedition 33 RPG
// Usage: node scripts/simulate-battle.js --npcs mime,mime --party gustave,maelle,lune --level 5
// ══════════════════════════════════════════════════════════════

// ── CLI Args ──
function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        npcs: [],
        party: [],
        level: 1,
        weaponLevel: null, // auto from level if not set
        iterations: 100,
        defenseRate: 0.5,
        verbose: false,
    };
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--npcs':       opts.npcs = args[++i].split(','); break;
            case '--party':      opts.party = args[++i].split(','); break;
            case '--level':      opts.level = parseInt(args[++i]); break;
            case '--weapon-level': opts.weaponLevel = parseInt(args[++i]); break;
            case '--iterations': opts.iterations = parseInt(args[++i]); break;
            case '--defense-rate': opts.defenseRate = parseFloat(args[++i]); break;
            case '--verbose':    opts.verbose = true; break;
            default:
                console.error(`Argumento desconhecido: ${args[i]}`);
                process.exit(1);
        }
    }
    if (opts.npcs.length === 0 || opts.party.length === 0) {
        console.error('Uso: node scripts/simulate-battle.js --npcs <ids> --party <ids> [--level N] [--iterations N] [--verbose]');
        process.exit(1);
    }
    // Auto weapon level from player level
    if (opts.weaponLevel == null) {
        if (opts.level <= 4) opts.weaponLevel = 1;
        else if (opts.level <= 8) opts.weaponLevel = 2;
        else if (opts.level <= 12) opts.weaponLevel = 3;
        else if (opts.level <= 16) opts.weaponLevel = 3;
        else opts.weaponLevel = 4;
    }
    return opts;
}

// ── Dice Utilities ──
function roll(sides) { return Math.floor(Math.random() * sides) + 1; }
function rollDie(dieSize) { return roll(dieSize); }

// ── Core Formulas ──
function abilityMod(score) { return Math.floor((score - 10) / 2); }
function profBonus(level) { return Math.floor((Math.max(1, level) - 1) / 4) + 2; }

function getIntensityDiceCount(intensity) {
    switch (intensity) {
        case 'high': return 2;
        case 'veryHigh': return 3;
        case 'extreme': return 4;
        case 'maximum': return 5;
        default: return 1;
    }
}

// ── NPC Data Loader ──
function loadNPCs() {
    const filePath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'NPCsList.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\r\n/g, '\n');

    const npcs = {};
    const lines = content.split('\n');
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        // Detect NPC block start (4 spaces + opening brace)
        if (/^    \{/.test(line) && !line.includes('type:') && !line.includes('itemId:')) {
            const blockLines = [];
            let braceCount = 0;
            let j = i;
            while (j < lines.length) {
                blockLines.push(lines[j]);
                braceCount += (lines[j].match(/\{/g) || []).length;
                braceCount -= (lines[j].match(/\}/g) || []).length;
                if (braceCount === 0) break;
                j++;
            }
            i = j + 1;

            const block = blockLines.join('\n');
            const idMatch = block.match(/id:\s*"([^"]+)"/);
            if (!idMatch) continue;

            const npc = parseNPCBlock(block, idMatch[1]);
            npcs[npc.id] = npc;
            continue;
        }
        i++;
    }
    return npcs;
}

function parseNPCBlock(block, id) {
    const getNum = (key) => { const m = block.match(new RegExp(`${key}:\\s*(-?\\d+)`)); return m ? parseInt(m[1]) : undefined; };
    const getStr = (key) => { const m = block.match(new RegExp(`${key}:\\s*"([^"]+)"`)); return m ? m[1] : undefined; };
    const getBool = (key) => { return new RegExp(`${key}:\\s*true`).test(block); };

    // Parse element arrays/single values for weakTo, resistentTo, imuneTo, absorbElement
    function parseElements(key) {
        // Array form: weakTo: ["Fire", "Ice"]
        const arrMatch = block.match(new RegExp(`${key}:\\s*\\[([^\\]]+)\\]`));
        if (arrMatch) {
            return arrMatch[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) ?? [];
        }
        // Single form: weakTo: "Fire"
        const singleMatch = block.match(new RegExp(`${key}:\\s*"([^"]+)"`));
        if (singleMatch) return [singleMatch[1]];
        return [];
    }

    // Parse attackList
    const attacks = [];
    const attackListMatch = block.match(/attackList:\s*\[([\s\S]*?)\],?\s*(?:passives|drops|freeShotWeakPoints|isFlying|noBasicAttack|\})/);
    if (attackListMatch) {
        const attackBlock = attackListMatch[1];
        // Split by individual attack objects
        const attackRegex = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
        let am;
        while ((am = attackRegex.exec(attackBlock)) !== null) {
            const a = am[1];
            const attack = {};
            const aStr = (k) => { const m2 = a.match(new RegExp(`${k}:\\s*"([^"]+)"`)); return m2 ? m2[1] : undefined; };
            const aNum = (k) => { const m2 = a.match(new RegExp(`${k}:\\s*(-?\\d+)`)); return m2 ? parseInt(m2[1]) : undefined; };
            const aBool = (k) => new RegExp(`${k}:\\s*true`).test(a);

            attack.type = aStr('type') || 'basic';
            attack.name = aStr('name');
            attack.element = aStr('element') || 'Physical';
            attack.intensity = aStr('intensity');
            attack.additionalDamage = aNum('additionalDamage') ?? 0;
            attack.quantity = aNum('quantity') ?? 1;
            attack.attackModifier = aNum('attackModifier') ?? 0;
            attack.targetsAll = aBool('targetsAll');
            attack.targeting = aStr('targeting');

            attacks.push(attack);
        }
    }

    return {
        id,
        strength: getNum('strength') ?? 10,
        dexterity: getNum('dexterity') ?? 10,
        constitution: getNum('constitution') ?? 10,
        intelligence: getNum('intelligence') ?? 10,
        wisdom: getNum('wisdom') ?? 10,
        charisma: getNum('charisma') ?? 10,
        armorClass: getNum('armorClass') ?? 10,
        proficiencyBonus: getNum('proficiencyBonus') ?? 2,
        damageDie: getNum('damageDie') ?? 6,
        maxLifeBonus: getNum('maxLifeBonus') ?? 0,
        initiativeBonus: getNum('initiativeBonus') ?? 0,
        freeShotWeakPoints: getNum('freeShotWeakPoints') ?? 0,
        playFirst: getBool('playFirst'),
        isBoss: getBool('isBoss'),
        noBasicAttack: getBool('noBasicAttack'),
        weakTo: parseElements('weakTo'),
        resistentTo: parseElements('resistentTo'),
        imuneTo: parseElements('imuneTo'),
        absorbElement: parseElements('absorbElement'),
        attackList: attacks,
    };
}

// ── Player Templates ──
const PLAYER_TEMPLATES = {
    gustave: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 10, hitDie: 10, attackAttr: 'str' },
    maelle:  { str: 10, dex: 16, con: 12, int: 10, wis: 12, cha: 14, hitDie: 8,  attackAttr: 'dex' },
    lune:    { str: 14, dex: 10, con: 12, int: 16, wis: 12, cha: 10, hitDie: 8,  attackAttr: 'str' },
    sciel:   { str: 10, dex: 14, con: 12, int: 12, wis: 10, cha: 16, hitDie: 8,  attackAttr: 'cha' },
    monoco:  { str: 14, dex: 12, con: 12, int: 10, wis: 16, cha: 12, hitDie: 8,  attackAttr: 'str' },
    verso:   { str: 16, dex: 10, con: 14, int: 10, wis: 12, cha: 10, hitDie: 10, attackAttr: 'str' },
};

// Level-based progression (simulates weapon/picto/lumina upgrades)
function getLevelProgression(level) {
    if (level <= 4)  return { weaponPower: 1200, scalingRank: 'C', pictoAttr: 0, pictoDef: 0, pictoVit: 0 };
    if (level <= 8)  return { weaponPower: 1200, scalingRank: 'B', pictoAttr: 1, pictoDef: 1, pictoVit: 1 };
    if (level <= 12) return { weaponPower: 1500, scalingRank: 'A', pictoAttr: 2, pictoDef: 1, pictoVit: 2 };
    if (level <= 16) return { weaponPower: 1800, scalingRank: 'A', pictoAttr: 3, pictoDef: 2, pictoVit: 3 };
    return              { weaponPower: 2000, scalingRank: 'S', pictoAttr: 4, pictoDef: 2, pictoVit: 4 };
}

// Replicate rankToValue from WeaponCalculator.ts
const RANKS = ['S', 'A', 'B', 'C', 'D'];
function displayWeaponAttributeRank(rank, level) {
    const index = RANKS.indexOf(rank);
    if (index === -1) return rank;
    if (level === 1) return RANKS[Math.min(index + 2, RANKS.length - 1)];
    if (level === 2) return RANKS[Math.min(index + 1, RANKS.length - 1)];
    if (level === 4) return RANKS[Math.max(index - 1, 0)];
    return rank;
}
function rankToValue(rank, level) {
    const weaponRank = displayWeaponAttributeRank(rank, level);
    const index = RANKS.indexOf(weaponRank) + 1;
    if (index === -1) return 0;
    return RANKS.length - index; // S=4, A=3, B=2, C=1, D=0
}

// Weapon damage die by weapon level
function weaponDamageDieSize(weaponLevel) {
    return { 1: 4, 2: 6, 3: 8, 4: 10 }[weaponLevel] ?? 4;
}

function buildPlayer(charId, level, weaponLevel) {
    const tmpl = PLAYER_TEMPLATES[charId];
    if (!tmpl) {
        console.error(`Personagem desconhecido: ${charId}. Disponíveis: ${Object.keys(PLAYER_TEMPLATES).join(', ')}`);
        process.exit(1);
    }

    const prog = getLevelProgression(level);

    // Weapon power: floor(power * weaponLevel / 1000)
    const weapPower = Math.floor(prog.weaponPower * weaponLevel / 1000);

    // Scaling rank gives defense & vitality bonuses
    const weapDefBonus = rankToValue(prog.scalingRank, weaponLevel);
    const weapVitBonus = rankToValue(prog.scalingRank, weaponLevel);

    // Effective ability scores (with picto bonus, capped at 20)
    const attrMap = { str: tmpl.str, dex: tmpl.dex, con: tmpl.con, int: tmpl.int, wis: tmpl.wis, cha: tmpl.cha };
    const atkBase = attrMap[tmpl.attackAttr];
    const effectiveAtkScore = Math.min(20, atkBase + prog.pictoAttr);
    const effectiveCon = Math.min(20, tmpl.con + weapVitBonus + prog.pictoVit);
    const effectiveDex = Math.min(20, tmpl.dex + prog.pictoDef); // picto speed → dex for AC

    const conMod = abilityMod(effectiveCon);
    const dexMod = abilityMod(effectiveDex);
    const atkMod = abilityMod(effectiveAtkScore);
    const prof = profBonus(level);

    const hitDie = tmpl.hitDie;
    const avgPerLevel = Math.floor(hitDie / 2) + 1;
    const maxHP = Math.max(1, hitDie + conMod + (level - 1) * (avgPerLevel + conMod));

    const ac = 10 + dexMod + weapDefBonus + prog.pictoDef;
    const attackBonus = atkMod + prof + weapPower;
    const damageBonus = atkMod + weapPower;
    const damageDie = weaponDamageDieSize(weaponLevel);

    // Free shot uses DEX
    const rawDex = Math.min(20, tmpl.dex + prog.pictoAttr); // pictos may help dex too, but for simplicity use base
    const freeShotDexMod = abilityMod(tmpl.dex);
    const freeShotHitBonus = freeShotDexMod + prof;
    const freeShotDamageBonus = freeShotDexMod;

    // Initial PM: max(0, intMod)
    const intMod = abilityMod(Math.min(20, tmpl.int + prog.pictoAttr));
    const initialPM = Math.max(0, abilityMod(tmpl.int));

    return {
        id: charId,
        team: 'player',
        maxHP, ac, attackBonus, damageBonus, damageDie,
        freeShotHitBonus, freeShotDamageBonus, freeShotDamageDie: damageDie,
        initialPM,
        dexMod: abilityMod(tmpl.dex),
        level,
    };
}

function buildNPC(npcData, index) {
    const maxHP = Math.max(1, npcData.constitution + npcData.maxLifeBonus);
    const strMod = abilityMod(npcData.strength);
    const dexMod = abilityMod(npcData.dexterity);
    const attackBonus = strMod + npcData.proficiencyBonus + (npcData.attackList[0]?.attackModifier ?? 0);

    return {
        id: `${npcData.id}${index > 0 ? '-' + (index + 1) : ''}`,
        baseId: npcData.id,
        team: 'npc',
        maxHP,
        ac: npcData.armorClass,
        strMod,
        dexMod,
        proficiencyBonus: npcData.proficiencyBonus,
        damageDie: npcData.damageDie,
        playFirst: npcData.playFirst,
        initiativeBonus: npcData.initiativeBonus,
        freeShotWeakPoints: npcData.freeShotWeakPoints,
        weakTo: npcData.weakTo,
        resistentTo: npcData.resistentTo,
        imuneTo: npcData.imuneTo,
        absorbElement: npcData.absorbElement,
        attackList: npcData.attackList,
        isBoss: npcData.isBoss,
    };
}

// ── Element Interaction ──
function elementMultiplier(element, target) {
    if (target.absorbElement && target.absorbElement.includes(element)) return -1; // heals
    if (target.imuneTo && target.imuneTo.includes(element)) return 0;
    if (target.resistentTo && target.resistentTo.includes(element)) return 0.5;
    if (target.weakTo && target.weakTo.includes(element)) return 2;
    return 1;
}

// ── Combat Engine ──
function simulateBattle(playerBuilds, npcBuilds, opts) {
    // Clone combatants
    const players = playerBuilds.map(p => ({
        ...p, hp: p.maxHP, pm: p.initialPM, totalDamage: 0,
    }));
    const npcs = npcBuilds.map(n => ({
        ...n, hp: n.maxHP, totalDamage: 0,
    }));

    const log = opts.verbose ? (...args) => console.log(...args) : () => {};

    // Roll initiative
    const combatants = [];
    for (const p of players) {
        const d = roll(6);
        let bonus = 0;
        if (d === 6) bonus = 4;
        if (d === 1) bonus = -2;
        p.initiative = d + p.dexMod + bonus;
        combatants.push(p);
    }
    for (const n of npcs) {
        const d = roll(6);
        let bonus = 0;
        if (d === 6) bonus = 4;
        if (d === 1) bonus = -2;
        n.initiative = d + n.dexMod + bonus + n.initiativeBonus;
        if (n.playFirst) n.initiative += 100; // Ensure they go first
        combatants.push(n);
    }

    // Sort by initiative (descending)
    combatants.sort((a, b) => b.initiative - a.initiative);

    let turns = 0;
    const MAX_TURNS = 50;

    while (turns < MAX_TURNS) {
        turns++;
        log(`\n── Turno ${turns} ──`);

        for (const actor of combatants) {
            if (actor.hp <= 0) continue;

            const alivePlayers = players.filter(p => p.hp > 0);
            const aliveNpcs = npcs.filter(n => n.hp > 0);

            if (alivePlayers.length === 0 || aliveNpcs.length === 0) break;

            if (actor.team === 'npc') {
                // ── NPC Turn ──
                npcTurn(actor, alivePlayers, opts, log);
            } else {
                // ── Player Turn ──
                // PM regen (+1 per turn, starting from turn 2)
                if (turns > 1) {
                    actor.pm = Math.min(9, actor.pm + 1);
                }
                playerTurn(actor, aliveNpcs, opts, log);
            }
        }

        // Check end conditions
        if (players.filter(p => p.hp > 0).length === 0) break;
        if (npcs.filter(n => n.hp > 0).length === 0) break;
    }

    const playerWin = npcs.filter(n => n.hp > 0).length === 0;

    return {
        winner: playerWin ? 'players' : 'npcs',
        turns,
        playersAlive: players.filter(p => p.hp > 0).length,
        playerDeaths: players.filter(p => p.hp <= 0).length,
        playerHpPct: players.reduce((s, p) => s + Math.max(0, p.hp), 0) / players.reduce((s, p) => s + p.maxHP, 0),
        npcHpPct: npcs.reduce((s, n) => s + Math.max(0, n.hp), 0) / npcs.reduce((s, n) => s + n.maxHP, 0),
        playerDamage: Object.fromEntries(players.map(p => [p.id, p.totalDamage])),
        npcDamage: Object.fromEntries(npcs.map(n => [n.id, n.totalDamage])),
    };
}

function npcTurn(npc, targets, opts, log) {
    // Pick random attack
    let attacks = npc.attackList;
    if (!attacks || attacks.length === 0) {
        attacks = [{ type: 'basic', element: 'Physical', additionalDamage: 0, quantity: 1, attackModifier: 0, intensity: undefined, targeting: 'single', targetsAll: false }];
    }
    const attack = attacks[Math.floor(Math.random() * attacks.length)];

    const element = attack.element || 'Physical';
    const diceCount = getIntensityDiceCount(attack.intensity);
    const atkMod = npc.strMod + npc.proficiencyBonus + (attack.attackModifier ?? 0);
    const quantity = attack.quantity ?? 1;
    const isAOE = attack.targetsAll || attack.targeting === 'all';

    const hitTargets = isAOE ? targets : [targets[Math.floor(Math.random() * targets.length)]];

    for (let q = 0; q < quantity; q++) {
        for (const target of hitTargets) {
            if (target.hp <= 0) continue;

            const d20 = roll(20);
            const total = d20 + atkMod;
            const hit = d20 === 20 || (d20 !== 1 && total >= target.ac);

            if (hit) {
                let damage = 0;
                for (let d = 0; d < diceCount; d++) {
                    damage += rollDie(npc.damageDie);
                }
                damage += npc.strMod + (attack.additionalDamage ?? 0);
                damage = Math.max(1, damage);

                // Critical hit: double dice
                if (d20 === 20) {
                    for (let d = 0; d < diceCount; d++) {
                        damage += rollDie(npc.damageDie);
                    }
                }

                // Defense check
                if (Math.random() < opts.defenseRate) {
                    damage = Math.floor(damage / 2);
                    log(`  ${npc.id} → ${target.id}: ${damage} dano (${element}, defendido)`);
                } else {
                    log(`  ${npc.id} → ${target.id}: ${damage} dano (${element})`);
                }

                target.hp -= damage;
                npc.totalDamage += damage;

                if (target.hp <= 0) {
                    log(`  💀 ${target.id} caiu!`);
                }
            } else {
                log(`  ${npc.id} → ${target.id}: errou (${d20}+${atkMod}=${total} vs AC ${target.ac})`);
            }
        }
    }
}

function playerTurn(player, aliveNpcs, opts, log) {
    if (aliveNpcs.length === 0) return;
    const target = aliveNpcs[Math.floor(Math.random() * aliveNpcs.length)];

    // ── Phase 1: Free Shots ──
    if (target.freeShotWeakPoints > 0 && player.pm >= 1) {
        // 60% chance to attempt, can do multiple
        while (player.pm >= 1 && Math.random() < 0.6) {
            player.pm -= 1;
            const d20 = roll(20);
            const total = d20 + player.freeShotHitBonus;
            const hit = d20 === 20 || (d20 !== 1 && total >= target.ac);

            if (hit) {
                let damage = rollDie(player.freeShotDamageDie) + player.freeShotDamageBonus;
                if (d20 === 20) damage += rollDie(player.freeShotDamageDie);
                damage = Math.max(1, damage);
                // Free shots are Physical
                const mult = elementMultiplier('Physical', target);
                damage = applyElementDamage(damage, mult);

                target.hp -= damage;
                player.totalDamage += damage;
                log(`  ${player.id} tiro livre → ${target.id}: ${damage} dano`);
            } else {
                log(`  ${player.id} tiro livre → ${target.id}: errou`);
            }

            if (target.hp <= 0) {
                log(`  💀 ${target.id} caiu!`);
                return;
            }
        }
    }

    // ── Phase 2: Main Action ──
    const aliveNow = aliveNpcs.filter(n => n.hp > 0);
    if (aliveNow.length === 0) return;
    const mainTarget = aliveNow[Math.floor(Math.random() * aliveNow.length)];

    const useSkill = Math.random() < 0.6 && player.pm >= 2;

    if (useSkill) {
        // Skill: costs 2-4 PM, 1.5-2.5x damage multiplier, 30% multi-hit
        const pmCost = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
        player.pm -= Math.min(pmCost, player.pm);

        const multiplier = 1.5 + Math.random(); // 1.5 to 2.5
        const multiHit = Math.random() < 0.3;
        const hits = multiHit ? (2 + Math.floor(Math.random() * 2)) : 1; // 2-3 hits

        for (let h = 0; h < hits; h++) {
            const t = aliveNow.filter(n => n.hp > 0);
            if (t.length === 0) break;
            const ht = t[Math.floor(Math.random() * t.length)];

            const d20 = roll(20);
            const total = d20 + player.attackBonus;
            const hit = d20 === 20 || (d20 !== 1 && total >= ht.ac);

            if (hit) {
                let baseDmg = rollDie(player.damageDie) + player.damageBonus;
                let damage = Math.max(1, Math.floor(baseDmg * multiplier / hits)); // split multiplier across hits
                if (d20 === 20) damage += rollDie(player.damageDie);

                const mult = elementMultiplier('Physical', ht);
                damage = applyElementDamage(damage, mult);

                ht.hp -= damage;
                player.totalDamage += damage;
                log(`  ${player.id} skill(${h + 1}/${hits}) → ${ht.id}: ${damage} dano`);

                if (ht.hp <= 0) log(`  💀 ${ht.id} caiu!`);
            } else {
                log(`  ${player.id} skill(${h + 1}/${hits}) → ${ht.id}: errou`);
            }
        }
    } else {
        // Basic attack
        const d20 = roll(20);
        const total = d20 + player.attackBonus;
        const hit = d20 === 20 || (d20 !== 1 && total >= mainTarget.ac);

        if (hit) {
            let damage = rollDie(player.damageDie) + player.damageBonus;
            if (d20 === 20) damage += rollDie(player.damageDie);
            damage = Math.max(1, damage);

            const mult = elementMultiplier('Physical', mainTarget);
            damage = applyElementDamage(damage, mult);

            mainTarget.hp -= damage;
            player.totalDamage += damage;
            log(`  ${player.id} ataque → ${mainTarget.id}: ${damage} dano`);

            if (mainTarget.hp <= 0) log(`  💀 ${mainTarget.id} caiu!`);
        } else {
            log(`  ${player.id} ataque → ${mainTarget.id}: errou (${d20}+${player.attackBonus}=${total} vs AC ${mainTarget.ac})`);
        }
    }
}

function applyElementDamage(damage, mult) {
    if (mult === -1) return -damage; // absorb = heal (negative damage)
    if (mult === 0) return 0;
    return Math.max(1, Math.floor(damage * mult));
}

// ── Main ──
function main() {
    const opts = parseArgs();
    const npcDB = loadNPCs();

    // Validate NPC IDs
    for (const id of opts.npcs) {
        if (!npcDB[id]) {
            console.error(`NPC não encontrado: "${id}"`);
            const similar = Object.keys(npcDB).filter(k => k.includes(id) || id.includes(k));
            if (similar.length > 0) console.error(`  Similares: ${similar.join(', ')}`);
            process.exit(1);
        }
    }

    // Validate player IDs
    for (const id of opts.party) {
        if (!PLAYER_TEMPLATES[id]) {
            console.error(`Personagem não encontrado: "${id}". Disponíveis: ${Object.keys(PLAYER_TEMPLATES).join(', ')}`);
            process.exit(1);
        }
    }

    // Build combatants
    const playerBuilds = opts.party.map(id => buildPlayer(id, opts.level, opts.weaponLevel));
    const npcCounts = {};
    const npcBuilds = opts.npcs.map(id => {
        npcCounts[id] = (npcCounts[id] ?? 0);
        const build = buildNPC(npcDB[id], npcCounts[id]);
        npcCounts[id]++;
        return build;
    });

    // Show stats
    console.log(`\n═══ Simulação: Party Lv.${opts.level} (Arma Lv.${opts.weaponLevel}) vs ${opts.npcs.join(', ')} ═══`);
    console.log(`Iterações: ${opts.iterations} | Defesa: ${Math.round(opts.defenseRate * 100)}%`);
    console.log('───────────────────────────────────────');

    // Show combatant stats
    console.log('Party:');
    for (const p of playerBuilds) {
        console.log(`  ${p.id.padEnd(10)} HP:${String(p.maxHP).padStart(4)} AC:${String(p.ac).padStart(3)} Atk:+${p.attackBonus} Dmg:+${p.damageBonus} d${p.damageDie} PM:${p.initialPM}`);
    }
    console.log('NPCs:');
    for (const n of npcBuilds) {
        const atkMod = n.strMod + n.proficiencyBonus;
        console.log(`  ${n.id.padEnd(20)} HP:${String(n.maxHP).padStart(5)} AC:${String(n.ac).padStart(3)} Atk:+${atkMod} d${n.damageDie}`);
    }
    console.log('───────────────────────────────────────');

    // Run verbose example first
    if (opts.verbose) {
        console.log('\n═══ Batalha Exemplo (verbose) ═══');
        simulateBattle(playerBuilds, npcBuilds, { ...opts, verbose: true });
        console.log('═══ Fim da Batalha Exemplo ═══\n');
    }

    // Run simulations
    const results = [];
    for (let i = 0; i < opts.iterations; i++) {
        results.push(simulateBattle(playerBuilds, npcBuilds, { ...opts, verbose: false }));
    }

    // Aggregate results
    const playerWins = results.filter(r => r.winner === 'players');
    const npcWins = results.filter(r => r.winner === 'npcs');

    const avgTurns = results.reduce((s, r) => s + r.turns, 0) / results.length;

    console.log(`Vitórias do grupo:  ${String(playerWins.length).padStart(4)}/${opts.iterations} (${(playerWins.length / opts.iterations * 100).toFixed(1)}%)`);
    console.log(`Vitórias dos NPCs:  ${String(npcWins.length).padStart(4)}/${opts.iterations} (${(npcWins.length / opts.iterations * 100).toFixed(1)}%)`);
    console.log(`Turnos (média):     ${avgTurns.toFixed(1)}`);
    console.log('───────────────────────────────────────');

    if (playerWins.length > 0) {
        const avgHpPct = playerWins.reduce((s, r) => s + r.playerHpPct, 0) / playerWins.length;
        const avgDeaths = playerWins.reduce((s, r) => s + r.playerDeaths, 0) / playerWins.length;
        console.log('Quando o grupo vence:');
        console.log(`  HP restante médio: ${(avgHpPct * 100).toFixed(1)}%`);
        console.log(`  Mortes por batalha: ${avgDeaths.toFixed(1)}`);
    }

    if (npcWins.length > 0) {
        const avgHpPct = npcWins.reduce((s, r) => s + r.npcHpPct, 0) / npcWins.length;
        console.log('Quando NPCs vencem:');
        console.log(`  HP restante médio: ${(avgHpPct * 100).toFixed(1)}%`);
    }

    // Damage per turn stats
    console.log('───────────────────────────────────────');
    console.log('Dano/turno (média):');

    const playerIds = opts.party;
    const npcIds = [...new Set(opts.npcs)];

    // Build duplicate-aware NPC ID list (matching buildNPC id generation)
    const npcIdCounts = {};
    const fullNpcIds = opts.npcs.map(id => {
        npcIdCounts[id] = (npcIdCounts[id] ?? 0);
        const fullId = npcIdCounts[id] > 0 ? `${id}-${npcIdCounts[id] + 1}` : id;
        npcIdCounts[id]++;
        return fullId;
    });

    for (let pi = 0; pi < playerIds.length; pi++) {
        const pId = playerIds[pi];
        const avgDmg = results.reduce((s, r) => s + (r.playerDamage[pId] ?? 0), 0) / results.length;
        const avgDpt = avgTurns > 0 ? avgDmg / avgTurns : 0;

        let line = `  ${pId.padEnd(12)} ${avgDpt.toFixed(1).padStart(6)}`;

        if (pi < fullNpcIds.length) {
            const nId = fullNpcIds[pi];
            const nAvgDmg = results.reduce((s, r) => s + (r.npcDamage[nId] ?? 0), 0) / results.length;
            const nAvgDpt = avgTurns > 0 ? nAvgDmg / avgTurns : 0;
            line += `    |  ${nId.padEnd(20)} ${nAvgDpt.toFixed(1).padStart(6)}`;
        }
        console.log(line);
    }

    // Print remaining NPCs if more NPCs than players
    for (let ni = playerIds.length; ni < fullNpcIds.length; ni++) {
        const nId = fullNpcIds[ni];
        const nAvgDmg = results.reduce((s, r) => s + (r.npcDamage[nId] ?? 0), 0) / results.length;
        const nAvgDpt = avgTurns > 0 ? nAvgDmg / avgTurns : 0;
        console.log(`  ${''.padEnd(12)} ${''.padStart(6)}    |  ${nId.padEnd(20)} ${nAvgDpt.toFixed(1).padStart(6)}`);
    }

    console.log('');
}

main();
