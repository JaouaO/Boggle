import { state, setWordSet } from "../core/state.js";
import { getGrid } from "../game/board.js";
import { solveBoard } from "../engine/solver.js";
import { normalizeWord } from "../engine/dictionary.js";

export function initUI() {

    const input = document.getElementById("wordInput");
    const checkBtn = document.getElementById("checkBtn");
    const result = document.getElementById("result");

    const solveBtn = document.getElementById("solveBtn");
    const solverResult = document.getElementById("solverResult");

    checkBtn.addEventListener("click", () => {

        const norm = normalizeWord(input.value.trim());

        if (!norm) {
            result.textContent = "Saisissez un mot.";
            return;
        }

        const found = state.wordSet.has(norm);

        result.textContent = found
            ? "✅ Mot trouvé"
            : "❌ Mot impossible";
    });

    solveBtn.addEventListener("click", () => {

        const grid = getGrid();

        const hasEmptyTile = grid.flat().some(cell => !cell);

        if (hasEmptyTile) {
            solverResult.textContent = "Complétez toutes les cases.";
            return;
        }

        const wordGroups = solveBoard(grid)
            .sort((a, b) =>
                a.norm.length - b.norm.length ||
                a.variants[0].localeCompare(b.variants[0], "fr")
            );

        setWordSet(wordGroups.map(group => group.norm));

        const displayWords = wordGroups.map(group =>
            group.variants.length > 1
                ? group.variants.join(" / ")
                : group.variants[0]
        );

        solverResult.innerHTML = wordGroups.length
            ? `<strong>${wordGroups.length} mot(s) trouvé(s)</strong><br>${displayWords.join(", ")}`
            : "Aucun mot trouvé.";
    });
}