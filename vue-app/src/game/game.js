import {GameResponse, GameResponseLetter, Presence} from "./models.js";

export class Game {
    constructor(words, word = null) {
        this.words = words;
        this.word = word || words[Math.floor(Math.random() * words.length)];
        this.tries = 0;
        this.ended = false;
    }

    // Исключения
    static Win = class Win extends Error {};
    static Lose = class Lose extends Error {
        constructor(gameResponse) {
            super("Lose");
            this.gameResponse = gameResponse;
        }
    };
    static NoWordError = class NoWordError extends Error {};
    static WordValidationError = class WordValidationError extends Error {};
    static GameEndedError = class GameEndedError extends Error {};

    generateGameResponse(word) {
        const letters = new Array(5);
        const counter = {};

        // Подсчёт частот букв загаданного слова
        for (const ch of this.word) {
            counter[ch] = (counter[ch] || 0) + 1;
        }

        // Сначала exact
        for (let i = 0; i < 5; i++) {
            if (word[i] === this.word[i]) {
                letters[i] = new GameResponseLetter(word[i], Presence.EXACT);
                counter[word[i]] -= 1;
            }
        }

        // Потом contains/missing
        for (let i = 0; i < 5; i++) {
            if (letters[i]) continue;
            if ((counter[word[i]] || 0) > 0) {
                letters[i] = new GameResponseLetter(word[i], Presence.CONTAINS);
                counter[word[i]] -= 1;
            } else {
                letters[i] = new GameResponseLetter(word[i], Presence.MISSING);
            }
        }

        return new GameResponse(letters);
    }

    makeTry(word) {
        if (this.ended) {
            throw new Game.GameEndedError();
        }
        if (word.length !== 5) {
            throw new Game.WordValidationError();
        }
        if (!this.words.includes(word)) {
            throw new Game.NoWordError();
        }
        if (word === this.word) {
            throw new Game.Win();
        }

        const gameResponse = this.generateGameResponse(word);

        this.tries += 1;
        if (this.tries === 6) {
            this.ended = true;
            throw new Game.Lose(gameResponse);
        }

        return gameResponse;
    }
}