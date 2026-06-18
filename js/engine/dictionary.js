let dictionary = new Set();
let prefixes = new Set();

/**
 * Normalise : supprime accents + uppercase
 */
export function normalizeWord(word) {
    return word
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Charge le dictionnaire + construit prefixes
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

    for (const words of Object.values(data)) {
        for (const word of words) {

            const norm = normalizeWord(word);

            dictionary.add(norm);

            // build prefixes
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

/**
 * test mot exact
 */
export function isWord(word) {
    return dictionary.has(word);
}

/**
 * pruning DFS
 */
export function hasPrefix(prefix) {
    return prefixes.has(prefix);
}