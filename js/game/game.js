import {
    createBoard,
    randomLetter,
    getGrid
} from "./board.js";

import { loadDictionary }
    from "../engine/dictionary.js";

import { solveBoard }
    from "../engine/solver.js";

import { setWordSet }
    from "../core/state.js";


export async function initGame(size) {

    createBoard(size);

    await loadDictionary(size);

    let words = [];
    let tries = 0;

    do {

        randomLetter(size);

        const grid = getGrid();

        words = solveBoard(grid);

        tries++;

    } while (words.length < 10 && tries < 50);

    console.log(
        "Grille validée en",
        tries,
        "essais →",
        words.length,
        "mots"
    );

setWordSet(words.map(word => word.norm));
}