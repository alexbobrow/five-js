import {Game} from "../game/game.js";

export class Session {
    constructor(resolver, game = null) {
        this.resolver = resolver;
        this.game = game ?? new Game(resolver.words);
    }

    playVerbose() {
        console.log(`Запуск игры. Загаданное слово: ${this.game.word}`);
        for (let i = 0; i < 6; i++) {
            try {
                this.attempt();
            } catch (e) {
                if (e instanceof Game.Win) {
                    console.log("Победа!");
                    break;
                } else if (e instanceof Game.Lose) {
                    console.log("Проигрыш! Было слово:", this.game.word);
                    break;
                } else {
                    throw e;
                }
            }
        }
    }

    play() {
        for (let i = 0; i < 6; i++) {
            this.attempt();
        }
    }

    attempt() {
        const resolverResponse = this.resolver.resolve();
        const attemptWord = resolverResponse.nextWord;
        const gameResponse = this.game.makeTry(attemptWord);
        this.resolver.applyResponse(gameResponse);
    }
}