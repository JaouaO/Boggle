import fs from "node:fs";
import { parse } from "csv-parse/sync";

const SOURCE_FILE = "./Morphalou3.1_CSV.csv";
const OUTPUT_FILE = "./diagnostic-morphalou.txt";

const TARGETS = [
    "maison",
    "maisons",
    "arbre",
    "arbres",
    "cheval",
    "chevaux",
    "enfant",
    "femme",
    "homme",
    "livre",
    "ville",
    "route",
    "école",
    "cœur",
    "œuf",
    "âge",
    "île",
    "laser",
    "poubelle",
    "abattre",
    "abattais",
    "abattu",
    "finis",
    "finissons"
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

function getAllFilledValues(row, columns) {
    return columns
        .map(column => row[column])
        .filter(value => value !== undefined && String(value).trim() !== "")
        .join(" ");
}

function getNonEmptyEntries(row) {
    return Object.entries(row)
        .filter(([, value]) => value !== undefined && String(value).trim() !== "");
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
        graphieColumns: headers.filter(header =>
            header === "graphie" ||
            /^graphie_\d+$/.test(header)
        ),

        categoryColumns: getColumnsContaining(headers, [
            "categorie",
            "category",
            "catgram",
            "part_of_speech",
            "pos"
        ]),

        subcategoryColumns: getColumnsContaining(headers, [
            "sous_categorie",
            "subcategory",
            "sub_category"
        ]),

        modeColumns: getColumnsByHeaderToken(headers, [
            "mode",
            "mood"
        ]),

        tenseColumns: getColumnsByHeaderToken(headers, [
            "temps",
            "tense"
        ]),

        personColumns: getColumnsByHeaderToken(headers, [
            "personne",
            "person"
        ]),
    };
}

function getCategoryText(row, columns) {
    return normalizeText([
        getAllFilledValues(row, columns.categoryColumns),
        getAllFilledValues(row, columns.subcategoryColumns),
    ].join(" "));
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
    const mode = normalizeText(modeValue);

    return (
        includesToken(mode, "infinitif") ||
        includesToken(mode, "infinitive") ||
        includesToken(mode, "participe") ||
        includesToken(mode, "participle") ||
        includesToken(mode, "indicatif") ||
        includesToken(mode, "subjonctif") ||
        includesToken(mode, "conditionnel") ||
        includesToken(mode, "imperatif") ||
        includesToken(mode, "imperative")
    );
}

function hasVerbMorphology(row, columns) {
    const mode = normalizeText(getMode(row, columns));
    const tense = normalizeText(getTense(row, columns));
    const person = normalizeText(getPerson(row, columns));

    return Boolean(
        isVerbMode(mode) ||
        tense.trim() ||
        person.trim()
    );
}

function isVerb(row, columns) {
    const categoryText = getCategoryText(row, columns);

    if (includesAnyToken(categoryText, ["verbe", "verb", "v"])) {
        return true;
    }

    return hasVerbMorphology(row, columns);
}

function isInfinitive(row, columns) {
    const mode = normalizeText(getMode(row, columns));

    return (
        includesToken(mode, "infinitif") ||
        includesToken(mode, "infinitive") ||
        includesToken(mode, "inf")
    );
}

function isPastParticiple(row, columns) {
    const mode = normalizeText(getMode(row, columns));
    const tense = normalizeText(getTense(row, columns));
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

function explainRow(row, columns, target) {
    const categoryText = getCategoryText(row, columns);
    const mode = normalizeText(getMode(row, columns));
    const tense = normalizeText(getTense(row, columns));
    const person = normalizeText(getPerson(row, columns));

    const explanations = [];

    explanations.push(`catégorie détectée : ${categoryText || "(vide)"}`);
    explanations.push(`mode : ${mode || "(vide)"}`);
    explanations.push(`temps : ${tense || "(vide)"}`);
    explanations.push(`personne : ${person || "(vide)"}`);
    explanations.push(`estVerbe : ${isVerb(row, columns) ? "oui" : "non"}`);
    explanations.push(`infinitif : ${isInfinitive(row, columns) ? "oui" : "non"}`);
    explanations.push(`participe passé : ${isPastParticiple(row, columns) ? "oui" : "non"}`);

    const graphies = columns.graphieColumns
        .map(column => `${column}="${row[column] ?? ""}"`)
        .join(" | ");

    explanations.push(`graphies : ${graphies}`);

    const targetInGraphie = columns.graphieColumns.some(column =>
        cleanWord(row[column]) === target
    );

    explanations.push(`mot trouvé dans une colonne graphie : ${targetInGraphie ? "oui" : "non"}`);

    return explanations;
}

function findRowsForTarget(records, columns, target) {
    const normalizedTarget = cleanWord(target);

    const exactGraphieRows = [];
    const exactAnyColumnRows = [];
    const containsAnyColumnRows = [];

    for (const [index, row] of records.entries()) {
        const graphieMatch = columns.graphieColumns.some(column =>
            cleanWord(row[column]) === normalizedTarget
        );

        if (graphieMatch) {
            exactGraphieRows.push({ index, row });
            continue;
        }

        const anyExactMatch = Object.values(row).some(value =>
            cleanWord(value) === normalizedTarget
        );

        if (anyExactMatch) {
            exactAnyColumnRows.push({ index, row });
            continue;
        }

        const anyContainsMatch = Object.values(row).some(value =>
            normalizeText(value).includes(normalizeText(normalizedTarget))
        );

        if (anyContainsMatch) {
            containsAnyColumnRows.push({ index, row });
        }
    }

    return {
        exactGraphieRows,
        exactAnyColumnRows,
        containsAnyColumnRows,
    };
}

function printRowDetails(output, rowInfo, columns, target) {
    const { index, row } = rowInfo;

    output.push(`--- Ligne CSV #${index + 1} ---`);

    for (const explanation of explainRow(row, columns, target)) {
        output.push(explanation);
    }

    output.push("");
    output.push("Colonnes non vides :");

    for (const [key, value] of getNonEmptyEntries(row)) {
        output.push(`  ${key}: ${value}`);
    }

    output.push("");
}

function run() {
    const records = readMorphalouCsv();

    if (!records.length) {
        throw new Error("CSV vide ou mal lu.");
    }

    const headers = Object.keys(records[0]);
    const columns = buildColumnContext(headers);

    const output = [];

    output.push("=== DIAGNOSTIC MORPHALOU ===");
    output.push("");
    output.push(`Nombre de lignes lues : ${records.length}`);
    output.push("");
    output.push("Colonnes détectées :");
    output.push(headers.join(" | "));
    output.push("");
    output.push(`Colonnes graphie : ${columns.graphieColumns.join(" | ") || "(aucune)"}`);
    output.push(`Colonnes catégorie : ${columns.categoryColumns.join(" | ") || "(aucune)"}`);
    output.push(`Colonnes sous-catégorie : ${columns.subcategoryColumns.join(" | ") || "(aucune)"}`);
    output.push(`Colonnes mode : ${columns.modeColumns.join(" | ") || "(aucune)"}`);
    output.push(`Colonnes temps : ${columns.tenseColumns.join(" | ") || "(aucune)"}`);
    output.push(`Colonnes personne : ${columns.personColumns.join(" | ") || "(aucune)"}`);
    output.push("");

    for (const rawTarget of TARGETS) {
        const target = cleanWord(rawTarget);
        const result = findRowsForTarget(records, columns, target);

        output.push("");
        output.push(`==============================`);
        output.push(`MOT TESTÉ : ${target}`);
        output.push(`==============================`);
        output.push(`Lignes avec correspondance exacte dans GRAPHIE : ${result.exactGraphieRows.length}`);
        output.push(`Lignes avec correspondance exacte ailleurs : ${result.exactAnyColumnRows.length}`);
        output.push(`Lignes contenant le mot ailleurs : ${result.containsAnyColumnRows.length}`);
        output.push("");

        const rowsToPrint = [
            ...result.exactGraphieRows.slice(0, 3),
            ...result.exactAnyColumnRows.slice(0, 2),
            ...result.containsAnyColumnRows.slice(0, 2),
        ];

        if (!rowsToPrint.length) {
            output.push("Aucune ligne trouvée pour ce mot.");
            output.push("");
            continue;
        }

        for (const rowInfo of rowsToPrint) {
            printRowDetails(output, rowInfo, columns, target);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, output.join("\n"), "utf8");

    console.log(`Diagnostic généré : ${OUTPUT_FILE}`);
    console.log("");
    console.log("Copiez-moi surtout les blocs pour :");
    console.log("- maison");
    console.log("- maisons");
    console.log("- arbre");
    console.log("- école");
    console.log("- abattais");
    console.log("- abattu");
}

run();