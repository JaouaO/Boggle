export const board =
    document.getElementById("board");

const dice4x4 = [
    "ETUKNO", "EVGTIN", "DECAMP", "IELRUW",
    "EHIFSE", "RECALS", "ENTDOS", "OFXRIA",
    "NAVEDZ", "EIOATA", "GLENYU", "BMAQJO",
    "TLIBRA", "SPULTE", "AIMSOR", "ENHRIS"
];

const dice5x5 = [
    "ETUKNO", "EVGTIN", "DECAMP", "IELRUW",
    "EHIFSE", "RECALS", "ENTDOS", "OFXRIA",
    "NAVEDZ", "EIOATA", "GLENYU", "BMAQJO",
    "TLIBRA", "SPULTE", "AIMSOR", "ENHRIS",
    "AAEIOU", "BCDFGH", "LMNRST", "PQRSTU",
    "AEIMRS", "OUAIEE", "NEURSS", "KLMNPQ",
    "RSTLNC"
];

function shuffle(array) {
    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}

export function createBoard(size) {

    board.innerHTML = "";
    board.style.gridTemplateColumns =
        `repeat(${size}, 1fr)`;

    for (let i = 0; i < size * size; i++) {

        const input = document.createElement("input");

        input.classList.add("tile");
        input.maxLength = 1;

        input.addEventListener("input", () => {
            input.value = input.value.toUpperCase();
        });

        board.appendChild(input);
    }
}

export function randomLetter(size) {

    const tiles =
        document.querySelectorAll(".tile");

    let dice;

    if(size === 3){

        // 9 dés aléatoires parmi les 16 du 4x4
        dice = shuffle(dice4x4).slice(0, 9);
    }
    else if(size === 4){
        dice = dice4x4;
    }
    else{
        dice = dice5x5;
    }

    const shuffledDice =
        shuffle(dice);

    tiles.forEach((tile, i) => {

        const die =
            shuffledDice[i];

        tile.value =
            die[Math.floor(Math.random() * 6)];
    });
}

export function getGrid(){

    const tiles =
        document.querySelectorAll(".tile");

    const size =
        Math.sqrt(tiles.length);

    const grid = [];

    let row = [];

    tiles.forEach((tile, i) => {

        row.push(tile.value);

        if((i + 1) % size === 0){
            grid.push(row);
            row = [];
        }
    });

    return grid;
}

const directions = [
    [-1,-1], [-1,0], [-1,1],
    [0,-1],         [0,1],
    [1,-1], [1,0], [1,1]
];