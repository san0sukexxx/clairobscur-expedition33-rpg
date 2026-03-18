const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── CR → Player Level mapping ──
// CR is the difficulty rating: 3 players of this level should have a fair fight (3v3)
function crToLevel(cr) {
    const map = {
        '1/4': 1, '1/2': 1,
        '1': 2, '2': 3, '3': 4, '4': 5, '5': 6,
        '6': 7, '7': 8, '8': 9, '9': 10, '10': 11,
        '11': 12, '12': 13, '13': 14, '14': 15, '15': 16,
        '16': 17, '17': 18, '18': 19, '19': 20, '20': 20,
        '22': 20,
    };
    return map[cr] ?? 10;
}

// ── Parse NPC data from NPCsList.ts (read CR per NPC) ──
function parseNPCCRs() {
    const filePath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'NPCsList.ts');
    const content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    const lines = content.split('\n');
    const npcCRs = {};
    let i = 0;

    while (i < lines.length) {
        if (/^    \{/.test(lines[i]) && !lines[i].includes('type:') && !lines[i].includes('itemId:')) {
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
            const crMatch = block.match(/challengeRating:\s*"([^"]+)"/);
            if (idMatch) {
                npcCRs[idMatch[1]] = crMatch ? crMatch[1] : null;
            }
            continue;
        }
        i++;
    }
    return npcCRs;
}

// ── Main ──
const npcCRs = parseNPCCRs();
const allIds = Object.keys(npcCRs);
const skipIds = new Set(['sophie', 'punch-bag']);
const npcCount = parseInt(process.argv[2] || '1');
const results = [];
let count = 0;

for (const id of allIds) {
    if (skipIds.has(id)) continue;

    const cr = npcCRs[id];
    const level = cr ? crToLevel(cr) : 10;

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
        const npcWinSection = out.match(/Quando NPCs vencem:\s*\n\s*HP restante médio:\s+([0-9.]+)%/);

        results.push({
            id, cr: cr ?? '-', level,
            winRate: winMatch ? winMatch[2] : '?',
            turns: turnsMatch ? turnsMatch[1] : '?',
            hpLeft: hpMatch ? hpMatch[1] : '-',
            deaths: deathsMatch ? deathsMatch[1] : '-',
            npcHpLeft: npcWinSection ? npcWinSection[1] : '-',
        });
    } catch (e) {
        results.push({ id, cr: cr ?? '-', level, winRate: 'ERR', turns: '-', hpLeft: '-', deaths: '-', npcHpLeft: '-' });
    }

    count++;
    if (count % 20 === 0) process.stderr.write(`  ${count}/${allIds.length - skipIds.size}...\n`);
}

// Print table
console.log('');
console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
console.log(` SIMULAÇÃO COMPLETA — Party (3) vs ${npcCount}x NPC | Nível baseado no CR | 100 iterações | Defesa: 50%`);
console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
console.log('');
console.log(' NPC                                    CR   Lv   Win%   Turnos  HP%Grp  Mortes  NPC HP%');
console.log(' ────────────────────────────────────  ────  ───  ──────  ──────  ──────  ──────  ───────');

for (const r of results) {
    const id = r.id.padEnd(36);
    const cr = String(r.cr).padStart(4);
    const lv = String(r.level).padStart(3);
    const wr = (r.winRate + '%').padStart(6);
    const t = String(r.turns).padStart(6);
    const hp = (r.hpLeft === '-' ? '  -   ' : (r.hpLeft + '%').padStart(6));
    const d = (r.deaths === '-' ? '  -   ' : String(r.deaths).padStart(6));
    const nhp = (r.npcHpLeft === '-' ? '   -   ' : (r.npcHpLeft + '%').padStart(7));
    console.log(` ${id}  ${cr}  ${lv}  ${wr}  ${t}  ${hp}  ${d}  ${nhp}`);
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════════════════════════════════════');
console.log(`Total: ${results.length} NPCs simulados`);

const tooEasy = results.filter(r => parseFloat(r.winRate) >= 90 && r.winRate !== '?');
const tooHard = results.filter(r => parseFloat(r.winRate) <= 20 && r.winRate !== '?' && r.winRate !== 'ERR');
const balanced = results.filter(r => { const w = parseFloat(r.winRate); return w >= 40 && w <= 75; });

console.log('');
console.log(`⚖️  Balanceados (40-75% win): ${balanced.length} NPCs`);
console.log(`🟢 Muito fáceis (90%+ win): ${tooEasy.length} NPCs`);
if (tooEasy.length > 0 && tooEasy.length <= 40) console.log(`   → ${tooEasy.map(r => r.id + '(' + r.cr + ')').join(', ')}`);
console.log(`🔴 Muito difíceis (≤20% win): ${tooHard.length} NPCs`);
if (tooHard.length > 0 && tooHard.length <= 40) console.log(`   → ${tooHard.map(r => r.id + '(' + r.cr + ')').join(', ')}`);
console.log('');
