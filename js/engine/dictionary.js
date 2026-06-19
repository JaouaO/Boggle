let dictionary = new Set();
let prefixes = new Set();
let displayByNorm = new Map();

/**
 * Normalise pour les calculs :
 * - majuscules
 * - suppression des accents
 */
export function normalizeWord(word) {
    return word
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Charge le dictionnaire + construit les préfixes
 */
export async function loadDictionary(size) {

    const file =
        size === 3
            ? "./assets/dico/dico_3_9.json"
            : size === 4
                ? "./assets/dico/dico_3_16.json"
                : "./assets/dico/dico_3_25.json";

    const res = await fetch(file);
    const data = await res.json();

    dictionary.clear();
    prefixes.clear();
    displayByNorm.clear();

    for (const words of Object.values(data)) {
        for (const word of words) {

            const display = word.toLocaleLowerCase("fr-FR");
            const norm = normalizeWord(display);

            dictionary.add(norm);

            if (!displayByNorm.has(norm)) {
                displayByNorm.set(norm, new Set());
            }

            displayByNorm.get(norm).add(display);

            for (let i = 1; i <= norm.length; i++) {
                prefixes.add(norm.slice(0, i));
            }
        }
    }

    console.log(
        "Dico chargé:",
        dictionary.size,
        "mots | prefixes:",
        prefixes.size
    );
}

export function isWord(word) {
    return dictionary.has(word);
}

export function hasPrefix(prefix) {
    return prefixes.has(prefix);
}

export function getDisplayWords(norm) {
    return [...(displayByNorm.get(norm) ?? [])];
}