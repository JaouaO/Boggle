import { state, setWordSet } from "../core/state.js";
import { getGrid } from "../game/board.js";
import { solveBoard } from "../engine/solver.js";
import { normalizeWord } from "../engine/dictionary.js";

const foundWords = new Map();

let foundWordsList;
let foundWordsCount;
let foundWordsScore;

let helpBtn;
let helpResult;
let helpIsOpen = false;

let cachedBoardKey = null;
let cachedWordGroups = [];

function getWordScore(length) {
    if (length <= 4) return 1;
    if (length === 5) return 2;
    if (length === 6) return 3;
    if (length === 7) return 5;

    return 11;
}

function getPointsLabel(points) {
    return `${points} ${points === 1 ? "point" : "points"}`;
}

function getFoundScore() {
    return [...foundWords.keys()].reduce((total, norm) => {
        return total + getWordScore(norm.length);
    }, 0);
}

function getPossibleScore(wordGroups) {
    return wordGroups.reduce((total, group) => {
        return total + getWordScore(group.norm.length);
    }, 0);
}

function getCurrentWordGroups() {
    const grid = getGrid();

    if (grid.flat().some(cell => !cell)) {
        cachedBoardKey = null;
        cachedWordGroups = [];
        setWordSet([]);

        return null;
    }

    const boardKey =
        `${grid.length}:${grid.flat().join("|")}`;

    if (boardKey !== cachedBoardKey) {
        cachedBoardKey = boardKey;
        cachedWordGroups = solveBoard(grid);

        setWordSet(
            cachedWordGroups.map(group => group.norm)
        );
    }

    return cachedWordGroups;
}

function renderFoundWords() {
    if (!foundWordsList) {
        return;
    }

    foundWordsList.replaceChildren();

    const entries = [...foundWords.entries()];
    const totalScore = getFoundScore();

    foundWordsCount.textContent =
        `${entries.length} ${entries.length === 1 ? "mot" : "mots"}`;

    foundWordsScore.textContent = getPointsLabel(totalScore);

    entries.forEach(([norm, variants], index) => {
        const score = getWordScore(norm.length);

        const pill = document.createElement("span");

        pill.className =
            `word-pill word-pill--${score}` +
            (index === entries.length - 1 ? " is-last" : "");

        const label = document.createElement("span");
        label.className = "word-pill__label";
        label.textContent = variants.join(" / ");

        const scoreBadge = document.createElement("span");
        scoreBadge.className = "word-pill__score";
        scoreBadge.textContent = `+${score}`;

        pill.append(label, scoreBadge);

        foundWordsList.appendChild(pill);
    });
}

function clearTileHelp() {
    document.querySelectorAll(".tile-help").forEach(hint => {
        hint.hidden = true;
        hint.textContent = "";
        hint.classList.remove("is-complete", "is-empty");
    });

    document.querySelectorAll(".tile").forEach(tile => {
        tile.removeAttribute("title");
    });
}

function renderTileHelp(wordGroups) {
    const possibleByCell = new Map();
    const foundByCell = new Map();

    wordGroups.forEach(group => {
        group.cells.forEach(cellKey => {
            possibleByCell.set(
                cellKey,
                (possibleByCell.get(cellKey) ?? 0) + 1
            );

            if (foundWords.has(group.norm)) {
                foundByCell.set(
                    cellKey,
                    (foundByCell.get(cellKey) ?? 0) + 1
                );
            }
        });
    });

    document.querySelectorAll(".tile").forEach(tile => {
        const cellKey = tile.dataset.cellKey;

        const possible = possibleByCell.get(cellKey) ?? 0;
        const found = foundByCell.get(cellKey) ?? 0;

        const hint = tile
            .closest(".tile-cell")
            .querySelector(".tile-help");

        hint.textContent = `${found}/${possible}`;
        hint.hidden = false;

        hint.classList.toggle(
            "is-complete",
            possible > 0 && found === possible
        );

        hint.classList.toggle(
            "is-empty",
            possible === 0
        );

        tile.title =
            `${found} mot(s) trouvé(s) sur ` +
            `${possible} mot(s) possible(s) utilisant cette case`;
    });
}

function createHelpStat(label, value) {
    const stat = document.createElement("div");
    stat.className = "help-stat";

    const title = document.createElement("span");
    title.className = "help-stat__label";
    title.textContent = label;

    const content = document.createElement("strong");
    content.className = "help-stat__value";
    content.textContent = value;

    stat.append(title, content);

    return stat;
}

function renderHelp(wordGroups) {
    if (!helpIsOpen || !helpResult) {
        return;
    }

    const foundCount = foundWords.size;
    const possibleCount = wordGroups.length;

    const foundScore = getFoundScore();
    const possibleScore = getPossibleScore(wordGroups);

    helpResult.replaceChildren();

    helpResult.append(
        createHelpStat(
            "Mots",
            `${foundCount}/${possibleCount}`
        ),
        createHelpStat(
            "Points",
            `${foundScore}/${possibleScore}`
        )
    );

    helpResult.hidden = false;

    renderTileHelp(wordGroups);
}

function hideHelp() {
    helpIsOpen = false;

    if (helpBtn) {
        helpBtn.textContent = "Aide";
        helpBtn.setAttribute("aria-expanded", "false");
    }

    if (helpResult) {
        helpResult.hidden = true;
        helpResult.replaceChildren();
    }

    clearTileHelp();
}

export function resetFoundWords() {
    foundWords.clear();

    renderFoundWords();
    hideHelp();
}

export function initUI() {

    const input = document.getElementById("wordInput");
    const checkBtn = document.getElementById("checkBtn");
    const result = document.getElementById("result");

    const solveBtn = document.getElementById("solveBtn");
    const solverResult = document.getElementById("solverResult");

    foundWordsList = document.getElementById("foundWords");
    foundWordsCount = document.getElementById("foundWordsCount");
    foundWordsScore = document.getElementById("foundWordsScore");

    helpBtn = document.getElementById("helpBtn");
    helpResult = document.getElementById("helpResult");

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

        const group = wordGroups.find(
            item => item.norm === norm
        );

        if (!group || !state.wordSet.has(norm)) {
            result.textContent = "❌ Mot impossible";
            input.select();
            return;
        }

        if (foundWords.has(norm)) {
            result.textContent =
                `↩️ Mot déjà trouvé : ` +
                foundWords.get(norm).join(" / ");

            input.select();
            return;
        }

        foundWords.set(norm, group.variants);

        renderFoundWords();
        renderHelp(wordGroups);

        result.textContent =
            `✅ Mot ajouté : ${group.variants.join(" / ")} ` +
            `(+${getWordScore(norm.length)})`;

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

    helpBtn.addEventListener("click", () => {
        if (helpIsOpen) {
            hideHelp();
            return;
        }

        const wordGroups = getCurrentWordGroups();

        if (!wordGroups) {
            result.textContent = "Complétez toutes les cases.";
            return;
        }

        helpIsOpen = true;

        helpBtn.textContent = "Masquer l’aide";
        helpBtn.setAttribute("aria-expanded", "true");

        renderHelp(wordGroups);
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
            group.variants.join(" / ")
        );

        solverResult.innerHTML = sortedGroups.length
            ? `<strong>${sortedGroups.length} mot(s) trouvé(s)</strong><br>${displayWords.join(", ")}`
            : "Aucun mot trouvé.";

        renderHelp(wordGroups);
    });

    document.getElementById("board").addEventListener("input", event => {
        if (!event.target.matches(".tile")) {
            return;
        }

        cachedBoardKey = null;
        cachedWordGroups = [];

        foundWords.clear();
        setWordSet([]);

        renderFoundWords();
        hideHelp();

        result.textContent = "";
        solverResult.textContent = "";
    });
}