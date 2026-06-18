import { createBoard, randomLetter, getGrid } from "./board.js";
import { loadDictionary } from "./dictionary.js";
import { refreshSolver } from "./ui.js";    
import { initUI } from "./ui.js";
import { solveBoard } from "./solveBoard.js";


const buttons = document.querySelectorAll(".size-btn");
const randomBtn = document.getElementById("randomBtn");

let currentSize = 4;

async function runSolver() {

    const grid = getGrid();

    const results = solveBoard(grid);

    console.log("Mots trouvés :", results);
}

async function init() {

    createBoard(currentSize);
    randomLetter(currentSize);
    await loadDictionary(currentSize);
    refreshSolver(); 
    initUI();
}

buttons.forEach(btn => {

    btn.addEventListener("click", async () => {

        currentSize = Number(btn.dataset.size);

        createBoard(currentSize);

        await loadDictionary(currentSize);

        randomLetter(currentSize);
    });
});

randomBtn.addEventListener("click", () => {
    randomLetter(currentSize);
});

const solveBtn =
    document.getElementById("solveBtn");

const solverResult =
    document.getElementById("solverResult");

solveBtn.addEventListener("click", () => {

    const grid = getGrid();

    if (!grid.length) return;


    const results = solveBoard(grid);

    solverResult.innerHTML =
        `<strong>${results.length} mots trouvés :</strong><br>` +
        results
            .sort((a, b) => b.length - a.length)
            .join(", ");
});

init();