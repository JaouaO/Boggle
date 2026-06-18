export const state = {

    wordSet: new Set()
};

export function setWordSet(words){

    state.wordSet =
        new Set(words);
}