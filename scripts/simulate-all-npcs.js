const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// NPC tier mapping (from scale-npcs.js)
const npcToTier = {
    'mime': 0,
    'jar': 1, 'portier': 1, 'lancer': 1, 'volester': 1, 'abbest': 1, 'chromatic-lancelier': 1, 'eveque': 1, 'chromatic-portier': 1,
    'noco': 2, 'luster': 2, 'demineur': 2, 'bruler': 2, 'cruler': 2, 'mime-flying-waters': 2, 'bourgeon': 2, 'chromatic-troubadour': 2, 'goblu': 2,
    'petank': 3, 'robust-sakapatate': 3, 'catapult-sakapatate': 3, 'ranger-sakapatate': 3, 'mime-ancient-sanctuary': 3, 'ultimate-sakapatate': 3,
    'gestral-warrior': 4, 'golgra': 4, 'jujubree': 4, 'eesda': 4,
    'esquie': 5, 'mime-esquies-nest': 5, 'petank-esquies-nest': 5, 'francois': 5,
    'jerijeri': 6, 'hexga': 6, 'reaper-cultist': 6, 'greatsword-cultist': 6, 'gold-chevaliere': 6, 'petank-stone-wave-cliffs': 6, 'rocher': 6, 'lampmaster-phase1': 6, 'lampmaster-phase2': 6, 'chromatic-gault': 6, 'chromatic-rocher': 6,
    'chalier': 7, 'petank-battlefield': 7, 'ramasseur': 7, 'troubadour': 7, 'cruler-battlefield': 7, 'dualliste-phase1': 7, 'dualliste-phase2': 7, 'chromatic-luster': 7,
    'stalact': 8,
    'steel-chevaliere': 9, 'ceramic-chevaliere': 9, 'renoir': 9, 'chromatic-danseuses': 9,
    'boucheclier': 10, 'contortionniste-visages': 10, 'moissoneusse-visages': 10, 'chapelier': 10, 'chromatic-ramasseur': 10, 'seething-boucheclier': 10, 'jovial-moissonneuse': 10, 'sorrowful-chapelier': 10, 'visages': 10, 'mask-keeper': 10,
    'ballet-sirene': 11, 'chorale': 11, 'benisseur': 11, 'petank-sirene': 11, 'chromatic-greatsword-cultist': 11, 'tisseur': 11, 'glissando': 11, 'sirene': 11,
    'lancer-monolith': 12, 'abbest-monolith': 12, 'portier-monolith': 12, 'clair': 12, 'bruler-monolith': 12, 'cruler-monolith': 12, 'demineur-monolith': 12, 'ranger-sakapatate-monolith': 12, 'robust-sakapatate-monolith': 12, 'catapult-sakapatate-monolith': 12, 'reaper-cultist-monolith': 12, 'greatsword-cultist-monolith': 12, 'petank-monolith': 12, 'mime-monolith': 12, 'obscur': 12, 'hexga-monolith': 12, 'chalier-monolith': 12, 'troubadour-monolith': 12, 'ramasseur-monolith': 12, 'danseuses': 12, 'ceramic-chevaliere-monolith': 12, 'gold-chevaliere-monolith': 12, 'pelerin': 12, 'braseleur': 12, 'the-paintress': 12, 'eveque-monolith': 12, 'chromatic-bourgeon': 12, 'ultimate-sakapatate-monolith': 12, 'gargant': 12, 'clair-obscur': 12, 'renoir-monolith': 12, 'chromatic-clair-obscur': 12,
    'the-curator': 13, 'clea': 13, 'gold-chevaliere-manor': 13, 'rocher-manor': 13,
    'aberration-act3': 14, 'contortionniste-act3': 14, 'moissoneusse-act3': 14, 'orphelin-act3': 14, 'ballet-act3': 14, 'mime-act3': 14, 'lumiere-citizen-act3': 14, 'renoir-act3': 14, 'creation-act3': 14, 'chromatic-echassier': 14,
};

// Tier → recommended player level
function tierToLevel(tier) {
    if (tier <= 0) return 1;
    if (tier <= 1) return 2;
    if (tier <= 2) return 3;
    if (tier <= 3) return 4;
    if (tier <= 4) return 5;
    if (tier <= 5) return 7;
    if (tier <= 6) return 8;
    if (tier <= 7) return 9;
    if (tier <= 8) return 10;
    if (tier <= 9) return 12;
    if (tier <= 10) return 13;
    if (tier <= 11) return 15;
    if (tier <= 12) return 17;
    if (tier <= 13) return 18;
    return 20;
}

// Get all NPC IDs
const content = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'src', 'data', 'NPCsList.ts'), 'utf8');
const allIds = [...content.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);

// Skip special NPCs without combat stats
const skipIds = new Set(['sophie', 'punch-bag']);

const npcCount = parseInt(process.argv[2] || '1');
const results = [];
let count = 0;

for (const id of allIds) {
    if (skipIds.has(id)) continue;

    const tier = npcToTier[id];
    const level = tier !== undefined ? tierToLevel(tier) : 10;

    const npcArg = Array(npcCount).fill(id).join(',');

    try {
        const out = execSync(
            `node scripts/simulate-battle.js --npcs ${npcArg} --party gustave,maelle,lune --level ${level} --iterations 100`,
            { encoding: 'utf8', timeout: 15000 }
        );

        const winMatch = out.match(/Vitórias do grupo:\s+(\d+)\/\d+\s+\(([0-9.]+)%\)/);
        const turnsMatch = out.match(/Turnos \(média\):\s+([0-9.]+)/);
        const hpMatch = out.match(/HP restante médio:\s+([0-9.]+)%/);
        const deathsMatch = out.match(/Mortes por batalha:\s+([0-9.]+)/);

        // Find NPC HP remaining when NPCs win
        const npcWinSection = out.match(/Quando NPCs vencem:\s*\n\s*HP restante médio:\s+([0-9.]+)%/);

        results.push({
            id,
            tier: tier !== undefined ? tier : '-',
            level,
            winRate: winMatch ? winMatch[2] : '?',
            turns: turnsMatch ? turnsMatch[1] : '?',
            hpLeft: hpMatch ? hpMatch[1] : '-',
            deaths: deathsMatch ? deathsMatch[1] : '-',
            npcHpLeft: npcWinSection ? npcWinSection[1] : '-',
        });
    } catch (e) {
        results.push({ id, tier: tier !== undefined ? tier : '-', level, winRate: 'ERR', turns: '-', hpLeft: '-', deaths: '-', npcHpLeft: '-' });
    }

    count++;
    if (count % 20 === 0) process.stderr.write(`  ${count}/${allIds.length - skipIds.size}...\n`);
}

// Print table
console.log('');
console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
console.log(' SIMULAÇÃO COMPLETA — Party (3) vs ${npcCount}x NPC | Gustave + Maelle + Lune | 100 iterações | Defesa: 50%');
console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
console.log('');
console.log(' NPC                                  Tier   Lv   Win%   Turnos  HP%Grp  Mortes  NPC HP%');
console.log(' ────────────────────────────────────  ────  ───  ──────  ──────  ──────  ──────  ───────');

for (const r of results) {
    const id = r.id.padEnd(36);
    const tier = String(r.tier).padStart(4);
    const lv = String(r.level).padStart(3);
    const wr = (r.winRate + '%').padStart(6);
    const t = String(r.turns).padStart(6);
    const hp = (r.hpLeft === '-' ? '  -   ' : (r.hpLeft + '%').padStart(6));
    const d = (r.deaths === '-' ? '  -   ' : String(r.deaths).padStart(6));
    const nhp = (r.npcHpLeft === '-' ? '   -   ' : (r.npcHpLeft + '%').padStart(7));
    console.log(` ${id}  ${tier}  ${lv}  ${wr}  ${t}  ${hp}  ${d}  ${nhp}`);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
console.log(`Total: ${results.length} NPCs simulados`);

// Summary: problematic NPCs
const tooEasy = results.filter(r => parseFloat(r.winRate) >= 99 && r.winRate !== '?');
const tooHard = results.filter(r => parseFloat(r.winRate) <= 20 && r.winRate !== '?' && r.winRate !== 'ERR');
const balanced = results.filter(r => { const w = parseFloat(r.winRate); return w >= 40 && w <= 80; });

console.log('');
console.log(`⚖️  Balanceados (40-80% win): ${balanced.length} NPCs`);
console.log(`🟢 Muito fáceis (99%+ win): ${tooEasy.length} NPCs`);
if (tooEasy.length > 0 && tooEasy.length <= 30) console.log(`   → ${tooEasy.map(r => r.id).join(', ')}`);
console.log(`🔴 Muito difíceis (≤20% win): ${tooHard.length} NPCs`);
if (tooHard.length > 0 && tooHard.length <= 30) console.log(`   → ${tooHard.map(r => r.id).join(', ')}`);
console.log('');
