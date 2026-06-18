import { solveBoard } from "./solveBoard.js";
import { getGrid } from "./board.js";
import { normalizeWord } from "./dictionary.js";

let wordSet = new Set();
export function initUI(){

    const wordInput =
        document.getElementById("wordInput");

    const checkBtn =
        document.getElementById("checkBtn");

    const result =
        document.getElementById("result");

    checkBtn.addEventListener("click", () => {

        const word =
            normalizeWord(wordInput.value.trim());

        const matches =
            wordSet.has(word);

        result.innerHTML =
            matches
            ? "✅ Mot trouvé"
            : "❌ Mot introuvable ou impossible sur la grille";
    });

    wordInput.addEventListener("keydown", e => {
        if(e.key === "Enter"){
            checkBtn.click();
        }
    });
}