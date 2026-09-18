import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

const SOURCE_FILE = "./Morphalou3.1_CSV.csv";

const OUTPUT_DIR = "./assets/dico";

const OUTPUTS = [
    { filename: "dico_3_9.json", maxLength: 9 },
    { filename: "dico_3_16.json", maxLength: 16 },
    { filename: "dico_3_25.json", maxLength: 25 },
];

const DEBUG = true;

const EDITORIAL_BLOCKED_WORDS = new Set([
    // Sigles / formats / termes techniques qui passent parfois sans catégorie fiable.
    "api", "css", "csv", "dns", "gif", "html", "http", "https",
    "jpeg", "jpg", "json", "pdf", "png", "rss", "seo", "sftp",
    "ssl", "svg", "tls", "tsv", "uri", "url", "xml",


    // Graphies non accentuées écartées pour privilégier l’affichage français propre.
    // Elles restent jouables grâce aux formes accentuées : âge/âges, île/îles.
    "age", "ages", "agé", "agée", "agés", "agées", "ile", "iles",
    // Noms propres / lieux purs.
    "angleterre", "berlin", "japon", "nice",

    // Résidus courts ou sigles restants après le filtre Dicollecte.
    "ada", "ava", "tva", "uva",
     "bay", "boy", "oxo", "pox",

    "bay",
"big",
"bye",
"drivé",
"speed",
"kdo",
"cte",
"xle",
"xve",
"xxe",

"dak",
"eye",
"gyr",
"mex",
"pox",
"tax",
"wus",
"yio",
"zio",
"zon",
"sri",
]);

const SAMPLES_TO_CHECK = [
    "maison", "maisons",
    "arbre", "arbres",
    "cheval", "chevaux",
    "enfant", "enfants",
    "femme", "femmes",
    "homme", "hommes",
    "livre", "livres",
    "ville", "villes",
    "route", "routes",
    "école", "écoles",
    "cœur", "cœurs",
    "œuf", "œufs",
    "âge", "âgé",
    "île", "îles",

    "laser", "poubelle",
    "sandwich", "parking",

    "être", "été",
    "abattre", "abattu", "abattue",
    "abattais", "abattait", "abatrais",
    "finis", "finissons",

    "apa", "aci", "abq", "dei", "iie", "cgy", "yci", "zgy",
    "api", "html", "download", "age", "ile", "ada", "ava", "lev", "tva", "uva",
];

function normalizeHeader(value) {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function makeUniqueHeaders(headers) {
    const counts = new Map();

    return headers.map((header, index) => {
        const base = normalizeHeader(header) || `col_${index}`;
        const count = counts.get(base) ?? 0;

        counts.set(base, count + 1);

        return count === 0 ? base : `${base}_${count + 1}`;
    });
}

function cleanWord(value) {
    return String(value ?? "")
        .trim()
        .toLocaleLowerCase("fr-FR")
        .normalize("NFC");
}

function normalizeText(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function cleanMorphValue(value) {
    const text = normalizeText(value).trim();

    if (
        text === "" ||
        text === "-" ||
        text === "—" ||
        text === "none" ||
        text === "null" ||
        text === "na" ||
        text === "n/a"
    ) {
        return "";
    }

    return text;
}

function tokenize(value) {
    return normalizeText(value)
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
}

function includesToken(value, token) {
    return tokenize(value).includes(token);
}

function includesAnyToken(value, tokens) {
    const valueTokens = tokenize(value);
    return tokens.some(token => valueTokens.includes(token));
}

function headerHasToken(header, tokens) {
    const parts = header.split("_").filter(Boolean);

    return tokens.some(token =>
        header === token ||
        parts.includes(token)
    );
}

function getColumnsContaining(headers, patterns) {
    return headers.filter(header =>
        patterns.some(pattern => header.includes(pattern))
    );
}

function getColumnsByHeaderToken(headers, tokens) {
    return headers.filter(header => headerHasToken(header, tokens));
}

function isSimpleFrenchWord(word) {
    return /^[a-zàâäéèêëîïôöùûüÿçœæ]+$/i.test(word);
}

function isAllUppercaseRawWord(rawWord) {
    const value = String(rawWord ?? "").trim();

    if (value.length < 2) {
        return false;
    }

    return (
        value === value.toUpperCase() &&
        /[A-ZÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇŒÆ]/.test(value)
    );
}

function isVowellessShortWord(word) {
    if (word.length !== 3) {
        return false;
    }

    const normalized = word
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replaceAll("œ", "oe")
        .replaceAll("æ", "ae");

    return !/[aeiouy]/.test(normalized);
}

function getAllFilledValues(row, columns) {
    return columns
        .map(column => row[column])
        .map(cleanMorphValue)
        .filter(Boolean)
        .join(" ");
}

function readMorphalouCsv() {
    const raw = fs.readFileSync(SOURCE_FILE, "utf8");
    const lines = raw.split(/\r?\n/);

    const headerIndex = lines.findIndex(line =>
        normalizeText(line).includes("graphie")
    );

    if (headerIndex === -1) {
        throw new Error("Impossible de trouver la ligne d’en-tête contenant GRAPHIE.");
    }

    const csv = lines.slice(headerIndex).join("\n");

    return parse(csv, {
        columns: makeUniqueHeaders,
        delimiter: ";",
        bom: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
    });
}

function buildColumnContext(headers) {
    return {
        wordColumns: headers.filter(header =>
            header === "graphie" ||
            /^graphie_\d+$/.test(header)
        ),

        categoryColumns: getColumnsContaining(headers, [
            "categorie",
            "category",
            "catgram",
            "part_of_speech",
            "pos",
        ]),

        subcategoryColumns: getColumnsContaining(headers, [
            "sous_categorie",
            "subcategory",
            "sub_category",
        ]),

        originColumns: getColumnsContaining(headers, [
            "origine",
            "origines",
            "etymologie",
            "etymology",
        ]),

        locutionColumns: getColumnsContaining(headers, [
            "locution",
        ]),

        modeColumns: getColumnsByHeaderToken(headers, [
            "mode",
            "mood",
        ]),

        tenseColumns: getColumnsByHeaderToken(headers, [
            "temps",
            "tense",
        ]),

        personColumns: getColumnsByHeaderToken(headers, [
            "personne",
            "person",
        ]),
    };
}

function getCandidateWords(row, wordColumns) {
    const words = [];

    for (const column of wordColumns) {
        const raw = row[column];

        if (raw === undefined || String(raw).trim() === "") {
            continue;
        }

        const word = cleanWord(raw);

        if (!word) {
            continue;
        }

        words.push({ raw, word });
    }

    const seen = new Set();

    return words.filter(item => {
        if (seen.has(item.word)) {
            return false;
        }

        seen.add(item.word);
        return true;
    });
}

function getCategoryText(row, columns) {
    return normalizeText([
        getAllFilledValues(row, columns.categoryColumns),
        getAllFilledValues(row, columns.subcategoryColumns),
        getAllFilledValues(row, columns.locutionColumns),
    ].join(" ")).trim();
}

function getOriginText(row, columns) {
    return normalizeText(getAllFilledValues(row, columns.originColumns)).trim();
}

function isProperNoun(row, columns) {
    const categoryText = getCategoryText(row, columns);

    return (
        categoryText.includes("nom propre") ||
        categoryText.includes("proper noun") ||
        categoryText.includes("propernoun")
    );
}

function getMode(row, columns) {
    return getAllFilledValues(row, columns.modeColumns);
}

function getTense(row, columns) {
    return getAllFilledValues(row, columns.tenseColumns);
}

function getPerson(row, columns) {
    return getAllFilledValues(row, columns.personColumns);
}

function isVerbMode(modeValue) {
    const mode = cleanMorphValue(modeValue);

    return (
        includesToken(mode, "infinitif") ||
        includesToken(mode, "infinitive") ||
        includesToken(mode, "participe") ||
        includesToken(mode, "participle") ||
        includesToken(mode, "indicatif") ||
        includesToken(mode, "indicative") ||
        includesToken(mode, "subjonctif") ||
        includesToken(mode, "subjunctive") ||
        includesToken(mode, "conditionnel") ||
        includesToken(mode, "conditional") ||
        includesToken(mode, "imperatif") ||
        includesToken(mode, "imperative")
    );
}

function hasVerbMorphology(row, columns) {
    const mode = getMode(row, columns);
    const tense = getTense(row, columns);
    const person = getPerson(row, columns);

    return Boolean(
        isVerbMode(mode) ||
        cleanMorphValue(tense) ||
        cleanMorphValue(person)
    );
}

function isVerb(row, columns) {
    const categoryText = getCategoryText(row, columns);

    if (includesAnyToken(categoryText, ["verbe", "verb", "v"])) {
        return true;
    }

    return hasVerbMorphology(row, columns);
}

function isLikelyInfinitive(word) {
    return (
        word === "être" ||
        word === "avoir" ||
        word.endsWith("er") ||
        word.endsWith("ir") ||
        word.endsWith("re") ||
        word.endsWith("oir")
    );
}

function isInfinitive(row, columns, word) {
    const mode = getMode(row, columns);

    if (
        includesToken(mode, "infinitif") ||
        includesToken(mode, "infinitive") ||
        includesToken(mode, "inf")
    ) {
        return true;
    }

    if (!hasVerbMorphology(row, columns)) {
        return isLikelyInfinitive(word);
    }

    return false;
}

function isPastParticiple(row, columns) {
    const mode = getMode(row, columns);
    const tense = getTense(row, columns);
    const text = normalizeText(`${mode} ${tense}`);

    if (
        text.includes("participe passe") ||
        text.includes("past participle")
    ) {
        return true;
    }

    const hasParticiple =
        includesToken(mode, "participe") ||
        includesToken(mode, "participle") ||
        includesToken(mode, "pp") ||
        text.includes("participe");

    const hasPast =
        includesToken(tense, "passe") ||
        includesToken(tense, "past") ||
        text.includes("passe");

    return hasParticiple && hasPast;
}

function shouldKeepVerb(row, columns, word) {
    if (isInfinitive(row, columns, word)) {
        return true;
    }

    if (isPastParticiple(row, columns)) {
        return true;
    }

    return false;
}

function isBadForGame(row, columns, rawWord) {
    const categoryText = getCategoryText(row, columns);
    const originText = getOriginText(row, columns);
    const combinedText = `${categoryText} ${originText}`;

    if (isAllUppercaseRawWord(rawWord)) {
        return true;
    }

    return (
        categoryText.includes("abreviation") ||
        categoryText.includes("abbreviation") ||
        categoryText.includes("sigle") ||
        categoryText.includes("acronyme") ||
        categoryText.includes("acronym") ||
        categoryText.includes("symbole") ||
        categoryText.includes("symbol") ||
        categoryText.includes("nom de marque") ||
        categoryText.includes("marque deposee") ||
        categoryText.includes("trademark") ||
        categoryText.includes("prefixe") ||
        categoryText.includes("suffixe") ||
        combinedText.includes("mot etranger") ||
        combinedText.includes("forme etrangere") ||
        combinedText.includes("foreign") ||
        combinedText.includes("anglais") ||
        combinedText.includes("english") ||
        combinedText.includes("anglicisme")
    );
}


function isEditorialBlockedWord(word) {
    return EDITORIAL_BLOCKED_WORDS.has(word);
}

function normalizeShortCodeShape(word) {
    return cleanWord(word)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replaceAll("œ", "oe")
        .replaceAll("æ", "ae")
        .toLowerCase();
}

function isGeneratedDicollecteShortCode(row, columns, word) {
    if (word.length !== 3) {
        return false;
    }

    const normalized = normalizeShortCodeShape(word);

    const looksGeneratedCode =
        /^[a-zµ](?:bq|cd|ci|da|ev|gy|hz|lm|lx|pa|sr|sv|va|wb|wh)$/.test(normalized);

    if (!looksGeneratedCode) {
        return false;
    }

    const categoryText = getCategoryText(row, columns);
    const originText = getOriginText(row, columns);

    return (
        !categoryText ||
        originText.includes("dicollecte")
    );
}

function isRomanNumeralLikeArtifact(word) {
    const normalized = normalizeShortCodeShape(word);

    return [
        "dei",
        "ide",
        "iie",
        "iide",
    ].includes(normalized);
}

function shouldKeepWord(row, columns, candidate) {
    const { raw, word } = candidate;

    if (word.length < 3) {
        return false;
    }

    if (!isSimpleFrenchWord(word)) {
        return false;
    }

    if (isEditorialBlockedWord(word)) {
        return false;
    }

    if (isVowellessShortWord(word)) {
        return false;
    }

    if (isGeneratedDicollecteShortCode(row, columns, word)) {
        return false;
    }

    if (isRomanNumeralLikeArtifact(word)) {
        return false;
    }

    if (isProperNoun(row, columns)) {
        return false;
    }

    if (isBadForGame(row, columns, raw)) {
        return false;
    }

    if (isVerb(row, columns)) {
        return shouldKeepVerb(row, columns, word);
    }

    return true;
}

function groupByLength(words, maxLength) {
    const result = {};

    for (let length = 3; length <= maxLength; length++) {
        result[String(length)] = [];
    }

    for (const word of words) {
        if (word.length < 3 || word.length > maxLength) {
            continue;
        }

        result[String(word.length)].push(word);
    }

    for (const length of Object.keys(result)) {
        result[length] = [...new Set(result[length])]
            .sort((a, b) => a.localeCompare(b, "fr"));
    }

    return result;
}

function buildBaseWordList() {
    const records = readMorphalouCsv();

    if (!records.length) {
        throw new Error("CSV vide ou mal lu.");
    }

    const headers = Object.keys(records[0]);
    const columns = buildColumnContext(headers);

    if (!columns.wordColumns.length) {
        console.log("Colonnes détectées :", headers);
        throw new Error("Aucune colonne de mot trouvée.");
    }

    if (DEBUG) {
        console.log("Colonnes de mots :", columns.wordColumns.join(" | "));
        console.log("Colonnes catégories :", columns.categoryColumns.join(" | "));
        console.log("Colonnes sous-catégories :", columns.subcategoryColumns.join(" | "));
        console.log("Colonnes origines :", columns.originColumns.join(" | "));
        console.log("Colonnes locution :", columns.locutionColumns.join(" | "));
        console.log("Colonnes mode :", columns.modeColumns.join(" | "));
        console.log("Colonnes temps :", columns.tenseColumns.join(" | "));
        console.log("Colonnes personne :", columns.personColumns.join(" | "));
        console.log("");
    }

    const words = new Set();

    let rowsKept = 0;
    let rowsRejected = 0;
    let wordsAdded = 0;

    for (const row of records) {
        const candidates = getCandidateWords(row, columns.wordColumns);

        let rowAddedSomething = false;

        for (const candidate of candidates) {
            if (!shouldKeepWord(row, columns, candidate)) {
                continue;
            }

            words.add(candidate.word);
            wordsAdded++;
            rowAddedSomething = true;
        }

        if (rowAddedSomething) {
            rowsKept++;
        } else {
            rowsRejected++;
        }
    }

    if (DEBUG) {
        console.log(`Lignes avec au moins un mot gardé : ${rowsKept}`);
        console.log(`Lignes sans mot gardé : ${rowsRejected}`);
        console.log(`Ajouts avant dédoublonnage : ${wordsAdded}`);
        console.log(`Mots uniques gardés : ${words.size}`);
        console.log("");
    }

    return [...words].sort((a, b) => a.localeCompare(b, "fr"));
}

function writeDictionaries() {
    const words = buildBaseWordList();

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    for (const output of OUTPUTS) {
        const grouped = groupByLength(words, output.maxLength);

        fs.writeFileSync(
            path.join(OUTPUT_DIR, output.filename),
            JSON.stringify(grouped, null, 2),
            "utf8"
        );

        const count = Object.values(grouped)
            .reduce((sum, list) => sum + list.length, 0);

        console.log(`${output.filename} généré : ${count} mots`);

        if (DEBUG) {
            for (const length of Object.keys(grouped)) {
                console.log(`  ${length} lettres : ${grouped[length].length}`);
            }

            const sampleStatus = SAMPLES_TO_CHECK.map(word => {
                const length = String(word.length);
                const present = grouped[length]?.includes(word) ?? false;

                return `${word}: ${present ? "présent" : "absent"}`;
            });

            console.log("Contrôle échantillon :");
            console.log(sampleStatus.join(" | "));
            console.log("");
        }
    }
}

writeDictionaries();
