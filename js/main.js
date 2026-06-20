import { initGame } from "./game/game.js";
import { initUI, resetFoundWords } from "./ui/ui.js";

let size = 4;

const sizeButtons = document.querySelectorAll(".size-btn");

function updateSizeButtons() {
    sizeButtons.forEach(btn => {
        const isActive = Number(btn.dataset.size) === size;

        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
    });
}

function clearMessages() {
    document.getElementById("wordInput").value = "";
    document.getElementById("result").textContent = "";
    document.getElementById("solverResult").textContent = "";
}

sizeButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
        const newSize = Number(btn.dataset.size);

        if (newSize === size) {
            return;
        }

        size = newSize;

        updateSizeButtons();
        clearMessages();
        resetFoundWords();

        await initGame(size);
    });
});

document.getElementById("randomBtn").addEventListener("click", async () => {
    clearMessages();
    resetFoundWords();
    await initGame(size);
});

updateSizeButtons();

await initGame(size);

initUI();