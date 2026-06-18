import { state } from "../core/state.js";

export function initUI(){

    const input = document.getElementById("wordInput");
    const btn = document.getElementById("checkBtn");
    const result = document.getElementById("result");

    btn.addEventListener("click", () => {

        const word = input.value.trim().toUpperCase();

        if(state.wordSet.has(word)){
            result.innerHTML = "✅ Mot trouvé";
        } else {
            result.innerHTML = "❌ Mot impossible";
        }
    });
}