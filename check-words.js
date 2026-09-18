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

function buildNormalizedIndex(dictionary) {
    const index = new Map();

    for (const word of dictionary) {
        const norm = normalizeForGame(word);

        if (!index.has(norm)) {
            index.set(norm, []);
        }

        index.get(norm).push(word);
    }

    for (const variants of index.values()) {
        variants.sort((a, b) => a.localeCompare(b, "fr"));
    }

    return index;
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
 * Mots décidés comme absents : sigles, abréviations, codes,
 * noms propres purs, lieux purs, graphies fautives ou formes non françaises.
 */
const CORE_EXPECTED_ABSENT_NOW = [
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

    "php",
    "npm",
    "vpn",
    "ftp",
    "sql",
    "tcp",
    "usb",
];

/**
 * Mots courts ajoutés après audit :
 * ne pas ajouter ici les vrais mots comme chi, bru, art, aux, clé, cri, que, qui, etc.
 */
const SHORT_EXPECTED_ABSENT_NOW = [
    "abq",
    "acd",
    "aev",
    "aff",
    "ahz",
    "alm",
    "alx",
    "asv",
    "avr",
    "avt",
    "awh",

    "bry",

    "cci",
    "cda",
    "cev",
    "cgy",
    "cpa",
    "cte",
    "cva",

    "dav",
    "daw",
    "dci",
    "dda",
    "dev",
    "dgy",
    "dpa",
    "dry",
    "dva",

    "ebq",
    "ecd",
    "eev",
    "ehz",
    "elm",
    "elx",
    "end",
    "esr",
    "esv",
    "ewb",
    "ewh",

    "fci",
    "fda",
    "fev",
    "fgy",
    "fla",
    "flâ",
    "fpa",
    "fra",
    "fva",

    "gci",
    "gda",
    "gev",
    "ggy",
    "gpa",

    "hci",
    "hda",
    "hev",
    "hgy",
    "hpa",
    "hva",

    "ips",

    "kci",
    "kda",
    "kdo",
    "kev",
    "kgy",
    "kpa",
    "kva",

    "mci",
    "mda",
    "mev",
    "mex",
    "mgy",
    "mme",
    "mpa",
    "mva",

    "nci",
    "nda",
    "nev",
    "new",
    "ngy",
    "npa",
    "nva",

    "ocs",
    "oct",
    "ord",
    "orf",

    "pci",
    "pda",
    "pev",
    "pgy",
    "ppa",
    "pre",
    "pva",

    "tci",
    "tda",
    "tev",
    "tex",
    "tgy",
    "tpa",
    "tte",
    "tva",

    "urf",
    "vox",
    "wad",
    "won",
    "wus",

    "xle",
    "xve",
    "xxe",

    "ybq",
    "ycd",
    "yev",
    "yhz",
    "ylm",
    "ylx",
    "ysr",
    "ysv",
    "ywb",
    "ywh",

    "zci",
    "zda",
    "zev",
    "zgy",
    "zpa",
    "zva",

    // Graphies fautives ou non retenues
    "agé",
    "agée",
    "agés",
    "agées",
];

const EXPECTED_ABSENT_NOW = uniqueSorted([
    ...CORE_EXPECTED_ABSENT_NOW,
    ...SHORT_EXPECTED_ABSENT_NOW,
]);

/**
 * Ces mots doivent rester présents malgré vos blocages.
 */
const EXPECTED_PRESENT_STILL = [
    "âge",
    "âges",
    "âgé",
    "âgée",
    "âgés",
    "âgées",

    "âme",
    "âmes",
    "âne",
    "ânes",
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
    "pêcheur",
    "pêcheurs",
    "pêcheuse",
    "pêcheuses",
    "péché",
    "péchés",

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

    // Vrais mots courts à préserver
    "bru",
    "chi",
    "ans",
    "arc",
    "ars",
    "art",
    "aux",
    "axe",
    "axé",
    "blé",
    "box",
    "clé",
    "coq",
    "cri",
    "cru",
    "crû",
    "dix",
    "dru",
    "est",
    "exo",
    "glu",
    "gré",
    "ifs",
    "lux",
    "max",
    "mix",
    "off",
    "ohm",
    "phi",
    "pli",
    "plu",
    "pré",
    "pro",
    "psi",
    "psy",
    "que",
    "qui",
    "rho",
    "rhô",
    "sax",
    "six",
    "ska",
    "ski",
    "spa",
    "thé",
    "tri",
    "uns",
    "wok",
];

/**
 * Pour les ligatures, on vérifie la forme normalisée du jeu.
 * Ainsi œuf / oeuf, bœuf / boeuf, cœur / coeur sont acceptés
 * si au moins une variante existe dans le dictionnaire.
 */
const EXPECTED_PRESENT_NORMALIZED = [
    ["COEUR", "cœur / coeur"],
    ["COEURS", "cœurs / coeurs"],
    ["OEUF", "œuf / oeuf"],
    ["OEUFS", "œufs / oeufs"],
    ["BOEUF", "bœuf / boeuf"],
    ["BOEUFS", "bœufs / boeufs"],
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
        "garcons"
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

    "mots courts valides à préserver": [
        "bru",
        "chi",
        "ans",
        "arc",
        "ars",
        "art",
        "aux",
        "axe",
        "axé",
        "blé",
        "box",
        "clé",
        "coq",
        "cri",
        "cru",
        "crû",
        "dix",
        "dru",
        "est",
        "exo",
        "glu",
        "gré",
        "ifs",
        "lux",
        "max",
        "mix",
        "off",
        "ohm",
        "phi",
        "pli",
        "plu",
        "pré",
        "pro",
        "psi",
        "psy",
        "que",
        "qui",
        "rho",
        "rhô",
        "sax",
        "six",
        "ska",
        "ski",
        "spa",
        "thé",
        "tri",
        "uns",
        "wok",
    ],

    "mots courts encore à relire": [
        "bri",
        "che",
        "chu",
        "dux",
        "erg",
        "ers",
        "fox",
        "gri",
        "ixe",
        "ixé",
        "kha",
        "khi",
        "ksi",
        "lev",
        "nov",
        "onc",
        "ors",
        "ort",
        "ost",
        "oxo",
        "pla",
        "pox",
        "qât",
        "qin",
        "sha",
        "spi",
        "sri",
        "tax",
        "xie",
        "xis",
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
        "agé",
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

function checkExpectedNormalized(normalizedIndex) {
    const errors = [];

    for (const [norm, label] of EXPECTED_PRESENT_NORMALIZED) {
        if (!normalizedIndex.has(norm)) {
            errors.push({
                word: label,
                norm,
                present: false,
                expectedPresent: true,
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

        if (error.norm) {
            console.log(`❌ ${error.word} — aucune variante trouvée pour ${error.norm}`);
        } else {
            console.log(`❌ ${error.word} — ${actual}, attendu ${expected}`);
        }
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

function writeReports(absentErrors, presentErrors, normalizedErrors, groupResults, normalizedIndex) {
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
        `Formes normalisées attendues mais absentes : ${normalizedErrors.length}`,
        ...normalizedErrors.map(error => `- ${error.word} (${error.norm})`),
        "",
        "=== FORMES NORMALISÉES CONTRÔLÉES ===",
        "",
        ...EXPECTED_PRESENT_NORMALIZED.flatMap(([norm, label]) => [
            `${label} — ${norm}`,
            normalizedIndex.has(norm)
                ? `Variantes trouvées : ${normalizedIndex.get(norm).join(", ")}`
                : "Variantes trouvées : aucune",
            "",
        ]),
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
        "Attention : ne pas copier automatiquement toute cette liste.",
        "Elle contient des candidats à décision.",
        "",
        ...uniqueSorted([...suggestedBlocked]).map(word => `"${word}",`),
    ]);

    writeFile("forced-blocked-courts-valides.txt", [
        "Bloc de mots courts validés comme indésirables.",
        "À copier dans FORCED_BLOCKED_WORDS si ce n'est pas déjà fait.",
        "",
        ...SHORT_EXPECTED_ABSENT_NOW.map(word => `"${word}",`),
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
    const normalizedIndex = buildNormalizedIndex(dictionary);

    if (runArgsMode(dictionary)) {
        return;
    }

    const absentErrors = checkExpected(dictionary, false, EXPECTED_ABSENT_NOW);
    const presentErrors = checkExpected(dictionary, true, EXPECTED_PRESENT_STILL);
    const normalizedErrors = checkExpectedNormalized(normalizedIndex);
    const groupResults = scanCandidateGroups(dictionary);

    console.log(`Dictionnaire chargé : ${dictionary.size} mots`);

    printExpectedErrors("MOTS QUI DEVRAIENT ÊTRE ABSENTS MAINTENANT", absentErrors);
    printExpectedErrors("MOTS QUI DOIVENT RESTER PRÉSENTS", presentErrors);
    printExpectedErrors("FORMES NORMALISÉES QUI DOIVENT EXISTER", normalizedErrors);
    printCandidateGroups(groupResults);

    writeReports(absentErrors, presentErrors, normalizedErrors, groupResults, normalizedIndex);

    console.log("");
    console.log(`Rapports générés dans : ${OUTPUT_DIR}`);
    console.log("");
    console.log("À ouvrir en priorité :");
    console.log(`- ${OUTPUT_DIR}/rapport.txt`);
    console.log(`- ${OUTPUT_DIR}/forced-blocked-courts-valides.txt`);
    console.log(`- ${OUTPUT_DIR}/suggestion-forced-blocked-a-relire.txt`);

    if (absentErrors.length || presentErrors.length || normalizedErrors.length) {
        process.exitCode = 1;
    }
}

run();