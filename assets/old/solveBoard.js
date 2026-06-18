import {
    normalizedDictionary,
    hasPrefix,
    isWord,
    normalizeWord
} from "./dictionary.js";
const directions = [
    [-1,-1], [-1,0], [-1,1],
    [0,-1],         [0,1],
    [1,-1], [1,0], [1,1]
];

export function solveBoard(grid){

    const results = new Set();

    const rows = grid.length;
    const cols = grid[0].length;

function dfs(r, c, word, visited){

    const key = r + "," + c;

    if(
        r < 0 || c < 0 ||
        r >= rows || c >= cols ||
        visited.has(key)
    ) return;

    word += grid[r][c];

    const normalized = normalizeWord(word);

    if(!hasPrefix(normalized)) return;

    visited.add(key);

    if(isWord(normalized)){
        results.add(normalized);
    }

    for(const [dr, dc] of directions){
        dfs(r + dr, c + dc, word, visited);
    }

    visited.delete(key);
}

    for(let r = 0; r < rows; r++){
        for(let c = 0; c < cols; c++){
            dfs(r, c, "", new Set());
        }
    }

    return Array.from(results);
}