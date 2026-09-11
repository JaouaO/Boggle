import fs from "node:fs";

const DICO_FILE = "./assets/dico/dico_3_25.json";
const OUTPUT_DIR = "./audit-after-forced";

function cleanWord(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase("fr-FR")
        .normalize("NFC");
}

function normalizeForGame(value) {
    return cleanWord(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replaceAll("œ", "oe")
        .replaceAll("æ", "ae")
        .toUpperCase();
}

function loadDictionary() {
    const data = JSON.parse(fs.readFileSync(DICO_FILE, "utf8"));
    const words = new Set();

    for (const list of Object.values(data)) {
        for (const word of list) {
            words.add(cleanWord(word));
        }
    }

    return words;
}

function writeFile(filename, lines) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(`${OUTPUT_DIR}/${filename}`, lines.join("\n"), "utf8");
}

function uniqueSorted(words) {
    return [...new Set(words.map(cleanWord))]
        .sort((a, b) => a.localeCompare(b, "fr"));
}

/**
 * Ces mots devraient maintenant être absents,
 * car vous les avez ajoutés ou déjà décidés comme bloqués.
 */
const EXPECTED_ABSENT_NOW = [
    "ssh",
    "age",
    "ages",
    "angleterre",
    "belgique",
    "berlin",
    "brésil",
    "canada",
    "drive",
    "ile",
    "iles",
    "inde",
    "japon",
    "lille",
    "orléans",
    "speed",
    "suisse",

    "nice",
    "download",
    "downloads",
    "upload",
    "uploads",
    "tsv",
    "xml",
    "json",
    "csv",
    "rss",
    "seo",
    "sftp",
    "ssl",
    "tls",
    "dns",
    "api",
    "url",
    "uri",
    "css",
    "html",
    "http",
    "https",
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "svg",
    "mp3",
    "mp4",
    "wifi",
    "sms",
    "gps",
];

/**
 * Ces mots doivent rester présents malgré vos blocages.
 * Ça évite de casser les formes françaises correctes.
 */
const EXPECTED_PRESENT_STILL = [
    "âge",
    "âges",
    "âgé",
    "âgée",
    "île",
    "îles",
    "école",
    "écoles",
    "hôtel",
    "hôtels",
    "forêt",
    "forêts",
    "pêche",
    "pêches",
    "péché",
    "péchés",
    "cœur",
    "cœurs",
    "œuf",
    "œufs",
    "bœuf",
    "bœufs",

    "berline",
    "berlines",

    "français",
    "française",
    "françaises",
    "anglais",
    "anglaise",
    "anglaises",
    "japonais",
    "japonaise",
    "japonaises",
    "indien",
    "indienne",
    "indiens",
    "indiennes",
    "canadien",
    "canadienne",
    "canadiens",
    "canadiennes",
    "belge",
    "belges",
    "brésilien",
    "brésilienne",
    "brésiliens",
    "brésiliennes",

    "maison",
    "arbre",
    "cheval",
    "école",
    "manger",
    "mangé",
    "mangée",
    "mangés",
    "mangées",
    "prendre",
    "pris",
    "prise",
    "prises",
    "prenant",
    "prenante",
    "prenants",
    "prenantes",
];

/**
 * Ce ne sont pas des erreurs automatiques.
 * Le script liste seulement lesquels sont présents.
 */
const CANDIDATE_GROUPS = {
    "pays / lieux purs à décider": [
        "allemagne",
        "italie",
        "espagne",
        "portugal",
        "russie",
        "chine",
        "maroc",
        "tunisie",
        "algérie",
        "grèce",
        "turquie",
        "irlande",
        "écosse",
        "autriche",
        "pologne",
        "norvège",
        "suède",
        "finlande",
        "danemark",
        "mexique",
        "argentine",
        "chili",
        "pérou",
        "égypte",
        "syrie",
        "liban",
        "iran",
        "irak",
        "israël",
    ],

    "villes / capitales à décider": [
        "paris",
        "lyon",
        "marseille",
        "toulouse",
        "rennes",
        "nantes",
        "bordeaux",
        "strasbourg",
        "grenoble",
        "dijon",
        "limoges",
        "angers",
        "tours",
        "nancy",
        "metz",
        "rome",
        "madrid",
        "londres",
        "tokyo",
        "oslo",
        "berne",
        "vienne",
        "prague",
        "bruxelles",
        "lisbonne",
        "athènes",
        "varsovie",
    ],

    "toponymes lexicalisés à surveiller mais souvent acceptables": [
        "champagne",
        "cognac",
        "bordeaux",
        "camembert",
        "brie",
        "chine",
        "florence",
        "vienne",
        "orange",
        "seine",
        "rhin",
        "rhône",
        "loire",
        "garonne",
    ],

    "formes sans accent à repérer": [
        "deja",
        "tres",
        "apres",
        "pres",
        "hotel",
        "hotels",
        "foret",
        "forets",
        "ecole",
        "ecoles",
        "eleve",
        "eleves",
        "peche",
        "peches",
        "pecheur",
        "pecheurs",
        "pecheuse",
        "pecheuses",
        "francais",
        "francaise",
        "francaises",
        "garcon",
        "garcons",
        "coeur",
        "coeurs",
        "oeuf",
        "oeufs",
        "boeuf",
        "boeufs",
    ],

    "anglais / technique encore possibles": [
        "software",
        "hardware",
        "server",
        "cloud",
        "framework",
        "manager",
        "startup",
        "business",
        "marketing",
        "gaming",
        "player",
        "team",
        "shop",
        "shopping",
        "game",
        "games",
        "online",
        "offline",
        "login",
        "logout",
        "debug",
        "mail",
        "web",
        "net",
        "top",
        "big",
        "boy",
        "bye",
        "bay",
        "cool",
        "cash",
    ],

    "anglais intégrés que vous pouvez garder": [
        "film",
        "films",
        "sport",
        "sports",
        "tennis",
        "football",
        "rugby",
        "parking",
        "parkings",
        "sandwich",
        "sandwiches",
        "camping",
        "campings",
        "budget",
        "budgets",
        "stock",
        "stocks",
        "bonus",
        "malus",
        "blog",
        "blogs",
        "site",
        "sites",
        "internet",
        "coach",
        "coachs",
        "podcast",
        "podcasts",
    ],

    "sigles / formats techniques voisins": [
        "ssh",
        "tsv",
        "xml",
        "json",
        "csv",
        "rss",
        "seo",
        "sftp",
        "ssl",
        "tls",
        "dns",
        "vpn",
        "smtp",
        "imap",
        "pop",
        "php",
        "js",
        "jsx",
        "ts",
        "tsx",
        "npm",
        "node",
        "mysql",
        "sql",
        "api",
        "url",
        "uri",
        "html",
        "css",
        "svg",
    ],

    "gentilés / dérivés à préserver normalement": [
        "français",
        "française",
        "françaises",
        "anglais",
        "anglaise",
        "anglaises",
        "italien",
        "italienne",
        "italiens",
        "italiennes",
        "espagnol",
        "espagnole",
        "espagnols",
        "espagnoles",
        "japonais",
        "japonaise",
        "japonaises",
        "chinois",
        "chinoise",
        "chinoises",
        "canadien",
        "canadienne",
        "canadiens",
        "canadiennes",
        "belge",
        "belges",
        "suisse",
        "suisses",
        "breton",
        "bretonne",
        "bretons",
        "bretonnes",
        "romain",
        "romaine",
        "romains",
        "romaines",
    ],

    "petits mots de 3 lettres à surveiller": [
        "ssh",
        "tsv",
        "xml",
        "dns",
        "ssl",
        "tls",
        "vpn",
        "php",
        "npm",
        "pop",
        "web",
        "net",
        "top",
        "big",
        "bay",
        "boy",
        "bye",
        "age",
        "ile",
        "lys",
        "kif",
        "zen",
        "zoo",
        "wax",
    ],
};

function checkExpected(dictionary, expectedPresent, words) {
    const errors = [];

    for (const rawWord of words) {
        const word = cleanWord(rawWord);
        const present = dictionary.has(word);

        if (present !== expectedPresent) {
            errors.push({
                word,
                present,
                expectedPresent,
            });
        }
    }

    return errors;
}

function scanCandidateGroups(dictionary) {
    const results = {};

    for (const [groupName, words] of Object.entries(CANDIDATE_GROUPS)) {
        const present = [];
        const absent = [];

        for (const rawWord of words) {
            const word = cleanWord(rawWord);

            if (dictionary.has(word)) {
                present.push(word);
            } else {
                absent.push(word);
            }
        }

        results[groupName] = {
            present: uniqueSorted(present),
            absent: uniqueSorted(absent),
        };
    }

    return results;
}

function printExpectedErrors(title, errors) {
    console.log("");
    console.log(title);
    console.log("-".repeat(title.length));

    if (!errors.length) {
        console.log("✅ Aucun problème.");
        return;
    }

    for (const error of errors) {
        const actual = error.present ? "présent" : "absent";
        const expected = error.expectedPresent ? "présent" : "absent";

        console.log(`❌ ${error.word} — ${actual}, attendu ${expected}`);
    }
}

function printCandidateGroups(results) {
    console.log("");
    console.log("GROUPES À RELIRE");
    console.log("================");

    for (const [groupName, result] of Object.entries(results)) {
        console.log("");
        console.log(groupName.toUpperCase());
        console.log(`Présents : ${result.present.length} | Absents : ${result.absent.length}`);

        if (result.present.length) {
            console.log("Présents :");
            for (const word of result.present) {
                console.log(`  + ${word}`);
            }
        }
    }
}

function writeReports(absentErrors, presentErrors, groupResults) {
    const suggestedBlocked = new Set();

    const suggestedGroups = [
        "pays / lieux purs à décider",
        "villes / capitales à décider",
        "formes sans accent à repérer",
        "anglais / technique encore possibles",
        "sigles / formats techniques voisins",
        "petits mots de 3 lettres à surveiller",
    ];

    for (const groupName of suggestedGroups) {
        for (const word of groupResults[groupName]?.present ?? []) {
            suggestedBlocked.add(word);
        }
    }

    writeFile("rapport.txt", [
        "=== AUDIT APRÈS FORCED_BLOCKED_WORDS ===",
        "",
        `Mots attendus absents mais présents : ${absentErrors.length}`,
        ...absentErrors.map(error => `- ${error.word}`),
        "",
        `Mots attendus présents mais absents : ${presentErrors.length}`,
        ...presentErrors.map(error => `- ${error.word}`),
        "",
        "=== GROUPES À RELIRE ===",
        "",
        ...Object.entries(groupResults).flatMap(([groupName, result]) => [
            groupName,
            `Présents : ${result.present.length}`,
            ...result.present.map(word => `+ ${word}`),
            "",
        ]),
    ]);

    writeFile("suggestion-forced-blocked-a-relire.txt", [
        "À RELIRE AVANT COPIE DANS FORCED_BLOCKED_WORDS",
        "",
        ...uniqueSorted([...suggestedBlocked]).map(word => `"${word}",`),
    ]);

    for (const [groupName, result] of Object.entries(groupResults)) {
        const filename = groupName
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-+|-+$/g, "")
            .toLowerCase();

        writeFile(`${filename}.txt`, [
            groupName,
            "",
            `Présents : ${result.present.length}`,
            ...result.present.map(word => `+ ${word}`),
            "",
            `Absents : ${result.absent.length}`,
            ...result.absent.map(word => `- ${word}`),
        ]);
    }
}

function runArgsMode(dictionary) {
    const args = process.argv.slice(2);

    if (!args.length) {
        return false;
    }

    console.log(`Dictionnaire chargé : ${dictionary.size} mots`);
    console.log("");

    for (const rawWord of args) {
        const word = cleanWord(rawWord);
        console.log(`${word.padEnd(24)} ${dictionary.has(word) ? "présent" : "absent"} — norm: ${normalizeForGame(word)}`);
    }

    return true;
}

function run() {
    const dictionary = loadDictionary();

    if (runArgsMode(dictionary)) {
        return;
    }

    const absentErrors = checkExpected(dictionary, false, EXPECTED_ABSENT_NOW);
    const presentErrors = checkExpected(dictionary, true, EXPECTED_PRESENT_STILL);
    const groupResults = scanCandidateGroups(dictionary);

    console.log(`Dictionnaire chargé : ${dictionary.size} mots`);

    printExpectedErrors("MOTS QUI DEVRAIENT ÊTRE ABSENTS MAINTENANT", absentErrors);
    printExpectedErrors("MOTS QUI DOIVENT RESTER PRÉSENTS", presentErrors);
    printCandidateGroups(groupResults);

    writeReports(absentErrors, presentErrors, groupResults);

    console.log("");
    console.log(`Rapports générés dans : ${OUTPUT_DIR}`);
    console.log("");
    console.log("À ouvrir en priorité :");
    console.log(`- ${OUTPUT_DIR}/rapport.txt`);
    console.log(`- ${OUTPUT_DIR}/suggestion-forced-blocked-a-relire.txt`);

    if (absentErrors.length || presentErrors.length) {
        process.exitCode = 1;
    }
}

run();