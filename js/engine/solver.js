import { DIRECTIONS } from "../core/config.js";
import {
    normalizeWord,
    hasPrefix,
    isWord
} from "./dictionary.js";

export function solveBoard(grid) {

    const results = new Set();

    const rows = grid.length;
    const cols = grid[0].length;

    function dfs(r, c, word, visited) {

        // bounds
        if (
            r < 0 || c < 0 ||
            r >= rows || c >= cols
        ) return;

        const key = r + "," + c;

        if (visited.has(key)) return;

        const letter = grid[r][c];
        const newWord = word + letter;
        const norm = normalizeWord(newWord);

        // PRUNING (très important pour perf)
        if (!hasPrefix(norm)) return;

        visited.add(key);

        // mot valide
        if (norm.length >= 3 && isWord(norm)) {
            results.add(norm);
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

    return [...results];
}