import { state, setWordSet } from "../core/state.js";
import { getGrid } from "../game/board.js";
import { solveBoard } from "../engine/solver.js";
import { normalizeWord, getDisplayWords } from "../engine/dictionary.js";

const foundWords = new Map();

let foundWordsList;
let foundWordsCount;

/**
 * Calcule les mots possibles de la grille actuelle,
 * sans forcément les afficher à l'écran.
 */
function getCurrentWordGroups() {
    const grid = getGrid();

    const hasEmptyTile = grid.flat().some(cell => !cell);

    if (hasEmptyTile) {
        return null;
    }

    const wordGroups = solveBoard(grid);

    setWordSet(wordGroups.map(group => group.norm));

    return wordGroups;
}

function renderFoundWords() {
    foundWordsList.replaceChildren();

    const entries = [...foundWords.entries()];

    foundWordsCount.textContent = entries.length;

    entries.forEach(([, variants], index) => {
        const pill = document.createElement("span");

        pill.className =
            index === entries.length - 1
                ? "word-pill is-last"
                : "word-pill";

        pill.textContent = variants.join(" / ");

        foundWordsList.appendChild(pill);
    });
}

export function resetFoundWords() {
    foundWords.clear();

    if (foundWordsList) {
        renderFoundWords();
    }
}

export function initUI() {
    const input = document.getElementById("wordInput");
    const checkBtn = document.getElementById("checkBtn");
    const result = document.getElementById("result");

    const solveBtn = document.getElementById("solveBtn");
    const solverResult = document.getElementById("solverResult");

    // Important : pas de "const" ici.
    foundWordsList = document.getElementById("foundWords");
    foundWordsCount = document.getElementById("foundWordsCount");

    renderFoundWords();

    function checkWord() {
        const norm = normalizeWord(input.value.trim());

        if (!norm) {
            result.textContent = "Saisissez un mot.";
            return;
        }

        const wordGroups = getCurrentWordGroups();

        if (!wordGroups) {
            result.textContent = "Complétez toutes les cases.";
            return;
        }

        if (!state.wordSet.has(norm)) {
            result.textContent = "❌ Mot impossible";
            input.select();
            return;
        }

        if (foundWords.has(norm)) {
            result.textContent =
                `↩️ Mot déjà trouvé : ${foundWords.get(norm).join(" / ")}`;

            input.select();
            return;
        }

        const variants = getDisplayWords(norm)
            .sort((a, b) => a.localeCompare(b, "fr"));

        foundWords.set(norm, variants);

        renderFoundWords();

        result.textContent =
            `✅ Mot ajouté : ${variants.join(" / ")}`;

        input.value = "";
        input.focus();
    }

    checkBtn.addEventListener("click", checkWord);

    input.addEventListener("keydown", event => {
        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();
        checkWord();
    });

    solveBtn.addEventListener("click", () => {
        const wordGroups = getCurrentWordGroups();

        if (!wordGroups) {
            solverResult.textContent = "Complétez toutes les cases.";
            return;
        }

        const sortedGroups = [...wordGroups].sort((a, b) =>
            a.norm.length - b.norm.length ||
            a.variants[0].localeCompare(b.variants[0], "fr")
        );

        const displayWords = sortedGroups.map(group =>
            group.variants.length > 1
                ? group.variants.join(" / ")
                : group.variants[0]
        );

        solverResult.innerHTML = sortedGroups.length
            ? `<strong>${sortedGroups.length} mot(s) trouvé(s)</strong><br>${displayWords.join(", ")}`
            : "Aucun mot trouvé.";
    });
}