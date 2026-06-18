export let dictionary = new Set();
export let normalizedDictionary = new Map();

export function normalizeWord(word){
    return word
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

export async function loadDictionary(size){

    let file;

    if(size === 3){
        file = "./assets/dico/dico_3_9.json";
    }
    else if(size === 4){
        file = "./assets/dico/dico_3_16.json";
    }
    else{
        file = "./assets/dico/dico_3_25.json";
    }

    const res = await fetch(file);
    const data = await res.json();

    dictionary.clear();
    normalizedDictionary.clear();

    Object.values(data).forEach(words => {

        words.forEach(word => {

            const upper = word.toUpperCase();

            dictionary.add(upper);

            const norm = normalizeWord(upper);

            if(!normalizedDictionary.has(norm)){
                normalizedDictionary.set(norm, []);
            }

            normalizedDictionary.get(norm).push(upper);
        });
    });
    buildPrefixes();

    console.log("Dico chargé :", dictionary.size);
    
}

export function findWords(word){

    const normalized =
        normalizeWord(word);

    const candidates =
        normalizedDictionary.get(normalized);

    if(!candidates) return [];

    return candidates.filter(w =>
        normalizeWord(w).length === normalized.length
    );
}


export function isWord(word){
    return normalizedDictionary.has(word);
}


export const prefixes = new Set();

export function buildPrefixes(){

    prefixes.clear();

    for(const key of normalizedDictionary.keys()){

        for(let i = 1; i <= key.length; i++){
            prefixes.add(key.slice(0, i));
        }
    }
}

export function hasPrefix(prefix){
    return prefixes.has(prefix);
}