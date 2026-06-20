import { DIRECTIONS } from "../core/config.js";
import {
    normalizeWord,
    hasPrefix,
    isWord,
    getDisplayWords
} from "./dictionary.js";

export function solveBoard(grid) {

    // Pour chaque mot, mémorise toutes les cases
    // utilisées par au moins un chemin valide.
    const cellsByWord = new Map();

    const rows = grid.length;
    const cols = grid[0].length;

    function registerWord(norm, path) {
        if (!cellsByWord.has(norm)) {
            cellsByWord.set(norm, new Set());
        }

        const cells = cellsByWord.get(norm);

        path.forEach(cellKey => cells.add(cellKey));
    }

    function dfs(r, c, word, visited, path) {

        if (
            r < 0 || c < 0 ||
            r >= rows || c >= cols
        ) {
            return;
        }

        const key = `${r},${c}`;

        if (visited.has(key)) {
            return;
        }

        const newWord = word + grid[r][c];
        const norm = normalizeWord(newWord);

        if (!hasPrefix(norm)) {
            return;
        }

        visited.add(key);
        path.push(key);

        if (norm.length >= 3 && isWord(norm)) {
            registerWord(norm, path);
        }

        for (const [dr, dc] of DIRECTIONS) {
            dfs(
                r + dr,
                c + dc,
                newWord,
                visited,
                path
            );
        }

        path.pop();
        visited.delete(key);
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            dfs(r, c, "", new Set(), []);
        }
    }

    return [...cellsByWord.entries()].map(([norm, cells]) => ({
        norm,
        variants: getDisplayWords(norm)
            .sort((a, b) => a.localeCompare(b, "fr")),
        cells: [...cells]
    }));
}