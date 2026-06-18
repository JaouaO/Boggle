import { initGame }
    from "./game/game.js";

import { initUI }
    from "./ui/ui.js";

let size = 4;

document
.querySelectorAll(".size-btn")
.forEach(btn => {

    btn.addEventListener(
        "click",
        async () => {

            size =
                Number(btn.dataset.size);

            await initGame(size);
        }
    );
});

document
.getElementById("randomBtn")
.addEventListener(
    "click",
    async () => {

        await initGame(size);
    }
);

await initGame(size);

initUI();