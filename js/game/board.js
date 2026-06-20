export const board =
    document.getElementById("board");

/* =========================
   DÉS OFFICIELS 4x4
========================= */
const dice4x4 = [
    "ETUKNO", "EVGTIN", "DECAMP", "IELRUW",
    "EHIFSE", "RECALS", "ENTDOS", "OFXRIA",
    "NAVEDZ", "EIOATA", "GLENYU", "BMAQJO",
    "TLIBRA", "SPULTE", "AIMSOR", "ENHRIS"
];

/* =========================
   EXTENSION 5x5 (cohérente)
   -> on garde logique fréquence FR
   -> évite suites absurdes
========================= */
const dice5x5 = [
    ...dice4x4,
    "AEIOUY", "SPULTE",
    "RECALS", "BMAQJO",
    "DECAMP", "WXYZEA",
    "ERISP", "TLIBRA",
    "GLENYU"
];

/* =========================
   SHUFFLE
========================= */
function shuffle(array) {

    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

/* =========================
   BOARD UI
========================= */
export function createBoard(size) {

    board.innerHTML = "";

    board.style.gridTemplateColumns =
        `repeat(${size}, 1fr)`;

    for (let i = 0; i < size * size; i++) {

        const row = Math.floor(i / size);
        const col = i % size;

        const cell = document.createElement("div");
        cell.classList.add("tile-cell");

        const input = document.createElement("input");

        input.classList.add("tile");
        input.maxLength = 1;
        input.dataset.cellKey = `${row},${col}`;

        input.setAttribute(
            "aria-label",
            `Lettre ligne ${row + 1}, colonne ${col + 1}`
        );

        input.addEventListener("input", () => {
            input.value = input.value.toUpperCase();
        });

        const hint = document.createElement("span");
        hint.classList.add("tile-help");
        hint.hidden = true;
        hint.setAttribute("aria-hidden", "true");

        cell.append(input, hint);
        board.appendChild(cell);
    }
}

/* =========================
   DÉS PAR TAILLE
========================= */
function getDice(size) {

    if (size === 3) {
        return shuffle(dice4x4).slice(0, 9);
    }

    if (size === 4) {
        return dice4x4;
    }

    return dice5x5;
}

/* =========================
   RANDOM LETTER (Boggle réel)
========================= */
export function randomLetter(size) {

    const tiles = document.querySelectorAll(".tile");

    const dice = shuffle(getDice(size));

    tiles.forEach((tile, i) => {

        const die = dice[i];

        tile.value =
            die[Math.floor(Math.random() * 6)];
    });
}

/* =========================
   GRID POUR SOLVER
========================= */
export function getGrid() {

    const tiles = document.querySelectorAll(".tile");

    const size = Math.sqrt(tiles.length);

    const grid = [];

    let row = [];

    tiles.forEach((tile, i) => {

        row.push(tile.value);

        if ((i + 1) % size === 0) {
            grid.push(row);
            row = [];
        }
    });

    return grid;
}