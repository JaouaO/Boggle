import { DIRECTIONS } from "../core/config.js";
import {
    normalizeWord,
    hasPrefix,
    isWord,
    getDisplayWords
} from "./dictionary.js";

export function solveBoard(grid) {

    const foundNorms = new Set();

    const rows = grid.length;
    const cols = grid[0].length;

    function dfs(r, c, word, visited) {

        if (
            r < 0 || c < 0 ||
            r >= rows || c >= cols
        ) return;

        const key = r + "," + c;

        if (visited.has(key)) return;

        const letter = grid[r][c];
        const newWord = word + letter;
        const norm = normalizeWord(newWord);

        if (!hasPrefix(norm)) return;

        visited.add(key);

        if (norm.length >= 3 && isWord(norm)) {
            foundNorms.add(norm);
        }

        for (const [dr, dc] of DIRECTIONS) {
            dfs(r + dr, c + dc, newWord, new Set(visited));
        }

        visited.delete(key);
    }

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            dfs(r, c, "", new Set());
        }
    }

    return [...foundNorms].map(norm => ({
        norm,
        variants: getDisplayWords(norm)
            .sort((a, b) => a.localeCompare(b, "fr"))
    }));
}