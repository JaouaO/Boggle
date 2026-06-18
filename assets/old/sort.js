const fs = require("fs");
const path = require("path");

// input
const inputPath = path.join(__dirname, "../assets/dico/dico_sorted.txt");
const input = fs.readFileSync(inputPath, "utf-8");

// parsing
let words = input
    .split("\n")
    .map(w => w.trim())
    .filter(Boolean);

// helper : build dictionary by length
function buildByLength(words, min, max) {
    const dict = {};

    for (const w of words) {
        const len = w.length;

        if (len < min || len > max) continue;

        if (!dict[len]) dict[len] = [];
        dict[len].push(w);
    }

    return dict;
}

// output writer
function saveJSON(name, data) {
    const outPath = path.join(__dirname, `../assets/dico/${name}`);
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
    console.log("✔ généré :", name);
}

// 3 versions demandées
const dico_3_9 = buildByLength(words, 3, 9);
const dico_3_16 = buildByLength(words, 3, 16);
const dico_3_25 = buildByLength(words, 3, 25);

// save
saveJSON("dico_3_9.json", dico_3_9);
saveJSON("dico_3_16.json", dico_3_16);
saveJSON("dico_3_25.json", dico_3_25);

console.log("🚀 build terminé !");