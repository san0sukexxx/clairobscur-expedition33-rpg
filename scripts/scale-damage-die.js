/**
 * Script to scale damageDie for all NPCs based on challengeRating.
 *
 * Mapping:
 *   CR 1/4 – 2  → damageDie: 4
 *   CR 3 – 6    → damageDie: 6
 *   CR 7 – 10   → damageDie: 8
 *   CR 11 – 15  → damageDie: 10
 *   CR 16 – 20  → damageDie: 12
 */

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "Frontend", "src", "data", "NPCsList.ts");
let content = fs.readFileSync(filePath, "utf-8");

// Parse challengeRating to a numeric value
function parseCR(cr) {
    if (cr === "1/4") return 0.25;
    if (cr === "1/2") return 0.5;
    return parseFloat(cr);
}

// Get damageDie for a given CR
function getDamageDie(crStr) {
    const cr = parseCR(crStr);
    if (cr <= 2) return 4;
    if (cr <= 6) return 6;
    if (cr <= 10) return 8;
    if (cr <= 15) return 10;
    if (cr <= 20) return 12;
    return 12; // CR > 20 gets d12
}

// Split file into NPC blocks (each { ... } inside the array)
// We'll process line by line, tracking brace depth

const lines = content.split("\n");
const result = [];

let inNpcBlock = false;
let blockLines = [];
let braceDepth = 0;
let arrayStarted = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect start of the NPCsBaseData array
    if (!arrayStarted && line.includes("NPCsBaseData:")) {
        arrayStarted = true;
        result.push(line);
        continue;
    }

    if (!arrayStarted) {
        result.push(line);
        continue;
    }

    // Count braces
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;

    if (!inNpcBlock && openBraces > 0 && braceDepth === 0) {
        // Start of an NPC block
        inNpcBlock = true;
        blockLines = [line];
        braceDepth = openBraces - closeBraces;
        if (braceDepth <= 0) {
            // Single-line block (unlikely but handle)
            result.push(...processBlock(blockLines));
            inNpcBlock = false;
            braceDepth = 0;
            blockLines = [];
        }
        continue;
    }

    if (inNpcBlock) {
        blockLines.push(line);
        braceDepth += openBraces - closeBraces;
        if (braceDepth <= 0) {
            // End of NPC block
            result.push(...processBlock(blockLines));
            inNpcBlock = false;
            braceDepth = 0;
            blockLines = [];
        }
        continue;
    }

    result.push(line);
}

function processBlock(lines) {
    const blockText = lines.join("\n");

    // Extract challengeRating
    const crMatch = blockText.match(/challengeRating:\s*"([^"]+)"/);
    if (!crMatch) {
        // No challengeRating — don't add damageDie
        return lines;
    }

    const cr = crMatch[1];
    const targetDie = getDamageDie(cr);

    // Check if damageDie already exists
    const hasDamageDie = blockText.match(/damageDie:\s*\d+/);

    if (hasDamageDie) {
        // Replace existing damageDie
        const updated = lines.map(l => {
            return l.replace(/damageDie:\s*\d+/, `damageDie: ${targetDie}`);
        });
        return updated;
    } else {
        // Insert damageDie after challengeRating line
        const updated = [];
        for (const l of lines) {
            updated.push(l);
            if (l.match(/challengeRating:\s*"/)) {
                // Detect indentation
                const indent = l.match(/^(\s*)/)[1];
                updated.push(`${indent}damageDie: ${targetDie},`);
            }
        }
        return updated;
    }
}

const output = result.join("\n");
fs.writeFileSync(filePath, output, "utf-8");

// Stats
const blocks = output.match(/challengeRating:/g) || [];
const damageDies = output.match(/damageDie:/g) || [];
console.log(`NPCs with challengeRating: ${blocks.length}`);
console.log(`NPCs with damageDie: ${damageDies.length}`);

// Count by die value
for (const die of [4, 6, 8, 10, 12]) {
    const regex = new RegExp(`damageDie: ${die}`, "g");
    const count = (output.match(regex) || []).length;
    console.log(`  d${die}: ${count}`);
}
